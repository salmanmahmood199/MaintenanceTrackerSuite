#!/bin/bash

echo "🔧 Fixing macOS file watching limits..."
echo "======================================="

# Check current limits
echo "Current file limits:"
ulimit -n

# Increase file limit for current session
echo "Increasing file limit to 65536..."
ulimit -n 65536

# Verify new limit
echo "New file limit:"
ulimit -n

echo ""
echo "✅ File limits increased!"
echo "Now run: npm start"
echo ""
echo "To make this permanent, add this to your ~/.zshrc:"
echo "ulimit -n 65536"