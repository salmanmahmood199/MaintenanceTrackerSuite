import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Configure CORS for mobile app access
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:5000',
    'http://192.168.1.153:8081',
    'http://192.168.1.153:5000', 
    'exp://192.168.1.153:8081',
    /^http:\/\/192\.168\.\d+\.\d+:(8081|5000)$/,  // Allow any local network IP with port 8081 or 5000
    /^exp:\/\/192\.168\.\d+\.\d+:8081$/,   // Allow Expo URLs
    /^http:\/\/.*\.replit\.dev$/,           // Allow Replit domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Validate critical environment variables
function validateEnvironmentVariables() {
  const requiredVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'SESSION_SECRET': process.env.SESSION_SECRET
  };

  const googleVars = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'GOOGLE_REDIRECT_URI': process.env.GOOGLE_REDIRECT_URI
  };

  const missing = [];
  const warnings = [];

  // Check required variables
  for (const [name, value] of Object.entries(requiredVars)) {
    if (!value) {
      missing.push(name);
    }
  }

  // Check Google Calendar variables (warnings only)
  const googleVarsCount = Object.values(googleVars).filter(Boolean).length;
  if (googleVarsCount > 0 && googleVarsCount < 3) {
    for (const [name, value] of Object.entries(googleVars)) {
      if (!value) {
        warnings.push(`${name} - Google Calendar integration may not work properly`);
      }
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(name => console.error(`  - ${name}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  console.log('✅ Environment variables validated');
}

// Enhanced error handler with better logging
function setupErrorHandlers(app: express.Express) {
  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`❌ Application Error [${status}]:`, {
      message: err.message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });

    res.status(status).json({ message });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Shutting down gracefully...');
    process.exit(1);
  });
}

(async () => {
  try {
    console.log('🚀 Starting server...');
    
    // Validate environment variables first
    validateEnvironmentVariables();

    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');
    
    // Serve mobile demo
    app.get('/mobile-demo.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../mobile-demo.html'));
    });

    // Setup enhanced error handlers
    setupErrorHandlers(app);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
      console.log('✅ Vite development server setup complete');
    } else {
      serveStatic(app);
      console.log('✅ Static file serving enabled');
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`🎉 Server is running successfully on port ${port}`);
      log(`🌐 Access your app at: http://localhost:${port}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      console.log('\n🛑 Received shutdown signal, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', (error as Error).stack);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('EADDRINUSE')) {
        console.error('💡 Port 5000 is already in use. Please close other applications using this port.');
      } else if (error.message.includes('EACCES')) {
        console.error('💡 Permission denied. You may need to run with elevated privileges.');
      } else if (error.message.includes('environment variables')) {
        console.error('💡 Please check your environment configuration and ensure all required variables are set.');
      }
    }
    
    process.exit(1);
  }
})();
