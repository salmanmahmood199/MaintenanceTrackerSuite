import React from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  BookOpen
} from 'lucide-react';

// Blog posts data (same as in BlogsPage but we'll extract this later)
const blogPosts = [
  {
    id: 1,
    title: "Harnessing AI for Proactive Maintenance: How Machine Learning Reduces Downtime",
    excerpt: "In today's hyper-competitive industrial landscape, unplanned equipment failures can halt production lines and erode profit margins. Machine learning-driven maintenance platforms address this challenge by continuously analyzing sensor and operational data to predict failures before they occur.",
    content: `
In today's hyper-competitive industrial landscape, unplanned equipment failures can halt production lines and erode profit margins. Machine learning (ML)-driven maintenance platforms address this challenge by continuously analyzing sensor and operational data to predict failures before they occur. By applying advanced algorithms—such as random forests, neural networks, and anomaly detection—these systems flag subtle deviations in vibration, temperature, or pressure that precede catastrophic breakdowns.

A 2024 McKinsey Global Survey found that 65 percent of enterprises report regular use of generative AI across one or more business functions, including operations and maintenance. Similarly, Menlo Ventures reports that 60 percent of generative AI investments now come from core innovation budgets, signaling widespread organizational commitment to ML-based solutions.

## Key Techniques in ML-Driven Maintenance

### Time-Series Analysis & Forecasting
Time-series models (e.g., ARIMA, LSTM) forecast equipment behavior by fitting historical sensor data trends and detecting anomalies when actual readings diverge beyond confidence intervals.

### Classification & Clustering
Supervised classifiers identify known failure modes (e.g., bearing wear), while unsupervised clustering (e.g., K-means) groups normal vs. abnormal operating regimes—automatically surfacing novel fault patterns.

### Digital Twins
Virtual replicas of physical assets run in parallel to real equipment, simulating "what-if" scenarios when parameters shift. Discrepancies between the twin and live sensor stream trigger maintenance alerts.

## Quantifiable Impact & Market Momentum
The global predictive maintenance market was valued at $10.93 billion in 2024 and is projected to reach $13.65 billion in 2025. With unplanned downtime for critical assets often costing $100,000 per hour or more, early fault detection translates into millions in annual savings. For example, a major automotive plant reduced unscheduled downtime by 30 percent within six months of deploying an ML-based maintenance system, recouping its subscription costs fivefold.

## Case Study: Automotive Manufacturing
At a mid-sized car assembly facility, vibration sensors on production-line motors fed data into an LSTM-based anomaly detector. Within two weeks, the model detected abnormal amplitude spikes in a conveyor motor's frequency spectrum—well before audible noise emerged. A preemptive bearing replacement averted a $250,000 line stoppage and earned a return on maintenance investment of 600 percent.

## Best Practices for Implementation
**Data Quality & Integration:** Consolidate IoT streams, ERP logs, and maintenance records into a unified data lake.

**Model Selection & Retraining:** Start with interpretable models (e.g., decision trees) before scaling to deep learning; schedule quarterly retraining as asset behavior evolves.

**Cross-Functional Governance:** Establish a joint team of operations, data science, and IT to prioritize high-value equipment and monitor model performance.

By embracing ML-driven maintenance, organizations transform reactive break-fix workflows into proactive, data-backed strategies—minimizing downtime, extending asset lifespans, and driving measurable ROI.

## References

McKinsey & Company. (2024). The Economic Potential of Generative AI: The Next Productivity Frontier.

Menlo Ventures. (2024). The State of Generative AI in the Enterprise 2024.

Fortune Business Insights. (2024). Predictive Maintenance Market Size, Share & Industry Analysis.`,
    date: "January 5, 2025",
    author: "TaskScout Team",
    category: "AI Technology",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=300&fit=crop&auto=format"
  },
  {
    id: 2,
    title: "The Rise of Predictive Maintenance: Market Trends and ROI",
    excerpt: "Predictive maintenance has shifted from niche pilot programs to mainstream operational strategy. By leveraging real-time analytics and AI, organizations forecast equipment health and schedule repairs just in time—avoiding both costly breakdowns and unnecessary servicing.",
    content: `
Predictive maintenance (PdM) has shifted from niche pilot programs to mainstream operational strategy. By leveraging real-time analytics and AI, organizations forecast equipment health and schedule repairs just in time—avoiding both costly breakdowns and unnecessary servicing.

## Explosive Market Growth
According to Fortune Business Insights, the global PdM market was valued at $10.93 billion in 2024 and is projected to grow to $13.65 billion in 2025. A separate MarketsandMarkets report forecasts an even steeper CAGR of 35.1 percent from 2024 to 2029, driven by rising AI adoption and IoT deployments.

## Financial Impact & ROI
Traditional reactive maintenance can cost up to $100,000 per hour in unplanned downtime for critical equipment. By contrast, companies that deploy PdM platforms report:

- 12–18 percent reduction in total maintenance costs
- An average $5 saved for every $1 spent on preventive programs
- A 400 percent return on investment (ROI) within the first year of implementation

A global electronics manufacturer saw cumulative savings of $2 million in its first year by prioritizing bearings and motors for predictive analytics, reducing emergency repairs by 45 percent.

## Key Drivers of Adoption
**Downtime Costs:** As asset complexity rises, so do the consequences of failures—prompting executive buy-in for PdM budgets.

**IoT Proliferation:** Widespread sensor installation on legacy and new equipment fuels continuous monitoring capabilities.

**AI Maturity:** Accessible ML frameworks and cloud compute lower barriers to entry for mid-market firms.

## Sector Use Cases
**Manufacturing:** Real-time vibration and thermal analysis on CNC machines.

**Energy & Utilities:** Transformer oil–analysis data feeds into anomaly detectors to preempt failures.

**Transportation:** Telematics and onboard diagnostics enable predictive servicing of vehicle fleets.

## Best Practices for Maximizing ROI
**Target High-Value Assets:** Begin with equipment that has the highest downtime costs.

**Blend PdM with Preventive Maintenance:** Use PdM to optimize schedules for routine tasks—avoiding over- or under-servicing.

**Continuous Improvement:** Track KPI shifts in MTBF (Mean Time Between Failures) and MTTR (Mean Time to Repair) to validate PdM efficacy.

With robust market momentum, verified cost savings, and a clear path to ROI, predictive maintenance is no longer an option—it's a strategic imperative for any asset-intensive organization.

## References

Fortune Business Insights. (2024). Predictive Maintenance Market Size Report, 2021–2028.

MarketsandMarkets. (2024). Predictive Maintenance Market Global Forecast to 2029.`,
    date: "February 10, 2025",
    author: "TaskScout Team",
    category: "Business Solutions",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=300&fit=crop&auto=format"
  },
  {
    id: 3,
    title: "HVAC Maintenance Best Practices: Ensuring Comfort and Efficiency",
    excerpt: "Heating, ventilation, and air-conditioning (HVAC) systems account for nearly 40 percent of total building energy consumption. As energy costs climb and sustainability mandates tighten, effective HVAC maintenance has become vital for both operational performance and environmental stewardship.",
    content: `
Heating, ventilation, and air-conditioning (HVAC) systems account for nearly 40 percent of total building energy consumption. As energy costs climb and sustainability mandates tighten, effective HVAC maintenance has become vital for both operational performance and environmental stewardship.

## Market Context
The global HVAC systems market was valued at USD 241.52 billion in 2024 and is expected to reach USD 258.97 billion in 2025, with a projected CAGR of 7.0 percent through 2033. Growth is fueled by rising construction activity in developing regions and retro-commissioning of aging building stock in mature markets.

## Energy Savings Through Best Practices
The U.S. Department of Energy estimates that comprehensive operations and maintenance (O&M) programs—covering tasks like filter replacement, coil cleaning, and system calibration—can reduce building energy use by 5–20 percent annually. At a 500,000 sq ft commercial facility, this translates to savings of over $200,000 per year in utility costs.

## Core Maintenance Activities

### Regular Filter Replacement
HVAC filters should be inspected monthly and replaced every 3 months (or sooner in dusty environments). Clean filters reduce fan energy consumption by up to 15 percent.

### Coil Cleaning & Inspection
Dirty evaporator and condenser coils impede heat transfer, forcing compressors to work harder. Annual coil cleaning prevents efficiency losses of 10–25 percent.

### Refrigerant Charge Verification
Both over- and under-charging refrigerant circuits decrease cooling capacity and raise energy use. Maintaining correct pressures enhances system longevity.

### Belt & Motor Alignment
Misaligned belts increase mechanical wear. Proper tensioning and lubrication can extend motor life by 30 percent.

## Predictive Analytics & IoT Integration
IoT-enabled thermostats, duct-pressure sensors, and flow meters feed real-time performance data into analytics platforms. Trends in discharge temperature or flow rate anomalies can trigger alerts—allowing technicians to intervene before a major failure occurs. Facilities deploying these sensors report 10–15 percent fewer emergency service calls and 8–12 percent lower energy bills.

## Seasonal Readiness & Commissioning
**Pre-Summer Checks:** Verify compressor and airflow performance ahead of peak cooling months.

**Pre-Winter Checks:** Test heating elements and backup heat sources before cold spells.

**Retro-Commissioning:** Periodic systematic recalibration of controls ensures setpoints and sequences match operational needs.

By adhering to a structured maintenance regimen—bolstered by data-driven insights—building operators can deliver tenant comfort, reduce energy consumption, and comply with evolving sustainability standards.

## References

U.S. Department of Energy. (2024). Commercial Building Energy Consumption Survey.

Grand View Research. (2024). HVAC Systems Market Size, Share & Trends Analysis Report.`,
    date: "March 3, 2025",
    author: "TaskScout Team", 
    category: "HVAC Systems",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&h=300&fit=crop&auto=format"
  },
  {
    id: 4,
    title: "Electrical Systems: Preventive Strategies to Avoid Costly Failures",
    excerpt: "Electrical infrastructure underpins every aspect of modern operations. From power distribution panels to motors and circuit breakers, undetected faults can cascade into safety hazards and prolonged downtime. Implementing preventive maintenance strategies is essential to safeguard assets and personnel.",
    content: `
Electrical infrastructure underpins every aspect of modern operations. From power distribution panels to motors and circuit breakers, undetected faults can cascade into safety hazards and prolonged downtime. Implementing preventive maintenance (PM) strategies is essential to safeguard assets and personnel.

## The Value Proposition of Preventive Maintenance
Preventive property maintenance programs reduce repair costs by 30 percent, boost asset value by up to 10 percent, and enhance system reliability—delivering both financial and operational returns. Moreover, data from the Associated Builders and Contractors shows an average of 377,000 construction job openings per month in 2023, highlighting workforce shortages that amplify the cost of emergency repairs.

## Key Preventive Measures for Electrical Systems

### Thermographic Inspections
Infrared imaging identifies hotspots in connections, bus bars, and switchgear—indicating high resistance points that can precede arc faults. Regular scans every 6–12 months catch issues invisible to the naked eye.

### Infrared Scanning & Ultrasonic Testing
Ultrasonic detectors pick up partial discharge and corona effects in high-voltage equipment—allowing targeted repairs on insulators and bushings before catastrophic breakdowns.

### Contact Tightening & Torque Verification
Loose electrical connections generate heat and accelerate metal fatigue. Using calibrated torque wrenches according to manufacturer specs ensures consistent contact pressure.

### Circuit Breaker Testing & Maintenance
Trip-curve testing and contact-cleaning prevent nuisance trips and ensure breakers operate within rated thresholds. An annual maintenance cycle is standard for critical distribution panels.

## Cost-Saving Outcomes
A large data center reported a 45 percent reduction in unplanned breaker failures after instituting quarterly infrared scans and targeted torque checks. Given that each outage can cost upwards of $50,000 per hour, this preventive regimen yielded a payback period of less than six months.

## Integrating Predictive Techniques
Combining traditional PM with condition-based monitoring—such as real-time current and voltage analytics—enables dynamic maintenance scheduling. Analytics platforms flag deviations from baseline impedance or harmonic profiles, prompting work orders through your maintenance ticketing app with pre-filled diagnostic details.

By embedding these preventive strategies into your maintenance workflow, you mitigate safety risks, extend equipment lifespans, and unlock significant cost savings—turning electrical reliability into a competitive advantage.

## References

International Facility Management Association. (2023). Preventive Maintenance Best Practices.

Associated Builders and Contractors. (2023). Construction Employment Report.`,
    date: "April 12, 2025",
    author: "TaskScout Team",
    category: "Electrical Systems", 
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=300&fit=crop&auto=format"
  },
  {
    id: 5,
    title: "IoT in Maintenance: Connecting Devices for Real-Time Insights",
    excerpt: "The Internet of Things (IoT) revolution has transformed maintenance from periodic checklists into continuous, data-driven processes. By wiring equipment with smart sensors, organizations gain unprecedented visibility into asset health—fueling proactive repairs and efficiency gains.",
    content: `
The Internet of Things (IoT) revolution has transformed maintenance from periodic checklists into continuous, data-driven processes. By wiring equipment with smart sensors, organizations gain unprecedented visibility into asset health—fueling proactive repairs and efficiency gains.

## Market Growth & Adoption Rates
The global predictive maintenance market is expected to grow at a 17 percent CAGR through 2028, driven largely by IoT deployments that feed analytics engines. In Europe, 28 percent of manufacturing companies now use IoT sensors specifically to track maintenance needs, reflecting broad recognition of its value in industrial settings.

## Core IoT Components for Maintenance

### Vibration & Acoustic Sensors
Tri-axial accelerometers detect imbalances or bearing wear; acoustic microphones capture ultrasonic emissions from leaking valves or partial discharges.

### Temperature & Thermal Imaging
Digital thermal cameras and RTD sensors monitor hotspots in motors, pumps, and electrical gear—alerting teams to excessive friction or electrical resistance.

### Pressure & Flow Transducers
Ensuring hydraulic and pneumatic systems maintain proper pressures prevents seal failures and fluid contamination. Real-time flow data highlights blockages or leaks.

### Connectivity & Gateways
Edge gateways aggregate sensor readings, perform initial anomaly filtering, and transmit compressed data to cloud platforms via protocols like MQTT or OPC UA.

## Real-Time Dashboards & Alerts
Dashboards visualize KPIs—such as vibration amplitude, bearing temperature, and power consumption—over time. When readings exceed predefined thresholds, the system auto-generates work orders in your maintenance ticketing app, complete with the sensor snapshot and recommended repair steps. Organizations report up to 20 percent faster response times and 15 percent higher first-time fix rates with this integration.

## Use Case: Food & Beverage Industry
A large food processing plant fitted its pasteurization pumps with IoT-enabled vibration monitors. When subtle increases in axis vibration signaled misalignment, technicians received in-app alerts and realigned pumps during scheduled downtime—avoiding costly batch spoilage and unplanned stoppages.

## Best Practices for IoT-Enabled Maintenance
**Edge Processing:** Filter data at the gateway to reduce bandwidth and storage costs.

**Security & Segmentation:** Isolate IoT networks with firewalls and TLS encryption to prevent unauthorized access.

**Scalability:** Choose cloud platforms that auto-scale storage and compute as sensor deployments grow.

By weaving IoT sensors into every level of your maintenance strategy, you create a living, breathing ecosystem—where equipment health is continuously monitored, interventions are precisely timed, and operational excellence becomes the norm.

## References

Grand View Research. (2024). Predictive Maintenance Market Size Report, 2021–2028.

IDC. (2023). IoT in Manufacturing: A European Perspective.`,
    date: "May 20, 2025",
    author: "TaskScout Team",
    category: "IoT Technology",
    readTime: "8 min read", 
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop&auto=format"
  }
];

// Helper function to get appropriate images for each category
const getPostImage = (category: string) => {
  switch (category) {
    case 'AI Technology':
      return 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop&auto=format';
    case 'Business Solutions':
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop&auto=format';
    case 'HVAC Systems':
      return 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&h=400&fit=crop&auto=format';
    case 'Electrical Systems':
      return 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=400&fit=crop&auto=format';
    case 'IoT Technology':
      return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&auto=format';
    default:
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop&auto=format';
  }
};

export default function BlogPostPage() {
  const [match, params] = useRoute('/blog/:id');
  
  if (!match || !params?.id) {
    return <div>Blog post not found</div>;
  }

  const post = blogPosts.find(p => p.id === parseInt(params.id));
  
  if (!post) {
    return <div>Blog post not found</div>;
  }

  const formatContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('## ')) {
          return <h2 key={index} className="text-lg font-semibold text-white mb-3 mt-5">{paragraph.replace('## ', '')}</h2>;
        } else if (paragraph.startsWith('### ')) {
          return <h3 key={index} className="text-base font-semibold text-white mb-2 mt-4">{paragraph.replace('### ', '')}</h3>;
        } else if (paragraph.startsWith('- ')) {
          const listItems = paragraph.split('\n- ').map(item => item.replace(/^- /, ''));
          return (
            <ul key={index} className="list-disc list-inside text-gray-300 mb-3 space-y-1 ml-4 text-sm">
              {listItems.map((item, i) => <li key={i} className="leading-relaxed text-sm">{item}</li>)}
            </ul>
          );
        } else if (paragraph.includes('**') && paragraph.includes(':**')) {
          // Handle definition-style paragraphs
          const parts = paragraph.split('**');
          return (
            <p key={index} className="text-gray-300 mb-3 leading-relaxed text-sm">
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="text-white font-medium text-sm">{part}</strong> : part
              )}
            </p>
          );
        } else {
          return <p key={index} className="text-gray-300 mb-3 leading-relaxed text-sm">{paragraph}</p>;
        }
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="relative z-10 px-6 pt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/blogs">
            <Button variant="ghost" className="mb-8 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <Badge variant="outline" className="border-teal-500/30 text-teal-300 mb-4">
              <BookOpen className="w-4 h-4 mr-2" />
              {post.category}
            </Badge>
            
            <h1 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center space-x-6 text-gray-400 text-xs mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {post.date}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.readTime}
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Image */}
          <div className="mb-8">
            <img 
              src={getPostImage(post.category)} 
              alt={post.title}
              className="w-full h-64 md:h-80 object-cover rounded-xl border border-white/10"
            />
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-xl p-5 md:p-6">
            <article className="max-w-none">
              {formatContent(post.content)}
            </article>
          </div>

          {/* Related Articles */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-white mb-4">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogPosts
                .filter(p => p.id !== post.id && p.category === post.category)
                .slice(0, 2)
                .map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`}>
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-lg p-6 hover:border-teal-500/30 transition-all duration-300 cursor-pointer">
                      <Badge variant="outline" className="border-teal-500/30 text-teal-300 mb-3">
                        {relatedPost.category}
                      </Badge>
                      <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h4>
                      <p className="text-gray-400 text-xs line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-4">
                        <Clock className="w-3 h-3 mr-1" />
                        {relatedPost.readTime}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce delay-1000"></div>
      </div>
    </div>
  );
}