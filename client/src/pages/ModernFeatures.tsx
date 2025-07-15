import { useEffect, useState } from 'react';
import { useSpring, animated, useTrail, config } from 'react-spring';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  Shield, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Target, 
  Sparkles,
  ArrowRight,
  Activity,
  Globe,
  Star,
  Lock,
  Database,
  Cpu,
  Timer
} from 'lucide-react';
import { Link } from 'wouter';

const features = [
  {
    id: 1,
    title: 'AI-Powered Analysis',
    description: 'Advanced machine learning algorithms analyze your trading patterns in real-time, providing personalized insights and recommendations.',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    category: 'Intelligence',
    benefits: ['Pattern Recognition', 'Predictive Analytics', 'Custom Insights'],
    video: '/api/placeholder/video1.mp4',
    stats: { accuracy: '94%', trades: '10K+' }
  },
  {
    id: 2,
    title: 'Real-Time Market Data',
    description: 'Live market feeds with microsecond precision, ensuring you never miss a trading opportunity with instant data updates.',
    icon: Activity,
    color: 'from-blue-500 to-cyan-500',
    category: 'Data',
    benefits: ['Live Feeds', 'Multi-Asset Support', 'Global Markets'],
    video: '/api/placeholder/video2.mp4',
    stats: { latency: '< 1ms', symbols: '5000+' }
  },
  {
    id: 3,
    title: 'Advanced Security',
    description: 'Bank-level encryption with multi-factor authentication and blockchain-based audit trails for maximum security.',
    icon: Shield,
    color: 'from-green-500 to-emerald-500',
    category: 'Security',
    benefits: ['256-bit Encryption', 'Multi-Factor Auth', 'Audit Trails'],
    video: '/api/placeholder/video3.mp4',
    stats: { uptime: '99.99%', security: 'Bank-Grade' }
  },
  {
    id: 4,
    title: 'Smart Portfolio Management',
    description: 'Automated portfolio optimization with risk management tools and intelligent position sizing algorithms.',
    icon: Target,
    color: 'from-orange-500 to-red-500',
    category: 'Management',
    benefits: ['Auto-Optimization', 'Risk Control', 'Position Sizing'],
    video: '/api/placeholder/video4.mp4',
    stats: { performance: '+23%', risk: 'Optimized' }
  },
  {
    id: 5,
    title: 'Lightning Performance',
    description: 'Ultra-fast execution with distributed computing and optimized algorithms for sub-millisecond response times.',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    category: 'Performance',
    benefits: ['Sub-ms Latency', 'Distributed Computing', 'Edge Locations'],
    video: '/api/placeholder/video5.mp4',
    stats: { speed: '0.1ms', nodes: '50+' }
  },
  {
    id: 6,
    title: 'Community Intelligence',
    description: 'Learn from thousands of successful traders with shared strategies, insights, and collaborative tools.',
    icon: Users,
    color: 'from-indigo-500 to-purple-500',
    category: 'Community',
    benefits: ['Shared Strategies', 'Expert Insights', 'Collaboration'],
    video: '/api/placeholder/video6.mp4',
    stats: { traders: '50K+', strategies: '1000+' }
  }
];

const architectureFeatures = [
  {
    icon: Database,
    title: 'Distributed Architecture',
    description: 'Scalable microservices architecture ensures high availability and performance'
  },
  {
    icon: Cpu,
    title: 'Edge Computing',
    description: 'Global edge nodes provide ultra-low latency access from anywhere'
  },
  {
    icon: Timer,
    title: 'Real-Time Processing',
    description: 'Stream processing handles millions of data points per second'
  },
  {
    icon: Lock,
    title: 'Zero-Trust Security',
    description: 'End-to-end encryption with blockchain-verified audit trails'
  }
];

export default function ModernFeatures() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [archRef, archInView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const heroAnimation = useSpring({
    opacity: heroInView ? 1 : 0,
    transform: heroInView ? 'translateY(0px)' : 'translateY(50px)',
    config: config.molasses
  });

  const featuresTrail = useTrail(features.length, {
    opacity: featuresInView ? 1 : 0,
    transform: featuresInView ? 'translateY(0px)' : 'translateY(100px)',
    config: { tension: 280, friction: 60 }
  });

  const archTrail = useTrail(architectureFeatures.length, {
    opacity: archInView ? 1 : 0,
    transform: archInView ? 'scale(1)' : 'scale(0.8)',
    config: { tension: 280, friction: 60 }
  });

  const floatingAnimation = useSpring({
    from: { transform: 'translateY(0px) rotate(0deg)' },
    to: async (next) => {
      while (true) {
        await next({ transform: 'translateY(-20px) rotate(5deg)' });
        await next({ transform: 'translateY(0px) rotate(0deg)' });
      }
    },
    config: { duration: 4000 }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 text-white overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <animated.div 
          style={floatingAnimation}
          className="absolute top-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
        <animated.div 
          style={floatingAnimation}
          className="absolute bottom-20 left-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-20">
        <animated.div style={heroAnimation} className="text-center max-w-6xl mx-auto">
          <Badge className="mb-6 bg-purple-500/20 text-purple-200 border-purple-400/30 text-lg px-6 py-2">
            Next-Generation Trading Platform
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Revolutionary
            <br />
            Features
          </h1>
          
          <p className="text-xl md:text-2xl text-purple-200 mb-12 max-w-4xl mx-auto leading-relaxed">
            Experience the future of trading with cutting-edge technology that adapts to your needs.
            Every feature is designed to give you the competitive edge you deserve.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/modern-dashboard">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none text-lg px-8 py-6">
                Explore Platform
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-purple-400 text-purple-100 hover:bg-purple-800/50 text-lg px-8 py-6">
              Watch Demo
              <Star className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </animated.div>
      </section>

      {/* Interactive Feature Showcase */}
      <section ref={featuresRef} className="relative z-10 py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Discover how our advanced technology revolutionizes your trading experience with intelligent automation and real-time insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {featuresTrail.map((style, index) => {
              const feature = features[index];
              const IconComponent = feature.icon;
              const isActive = activeFeature === index;
              
              return (
                <animated.div 
                  key={feature.id} 
                  style={style}
                  onMouseEnter={() => setActiveFeature(index)}
                  className="cursor-pointer"
                >
                  <Card className={`h-full bg-gradient-to-br from-purple-900/70 to-pink-900/50 border-purple-500/30 hover:border-purple-400/70 transition-all duration-500 backdrop-blur-sm transform ${
                    isActive ? 'scale-105 border-pink-400/70 shadow-2xl shadow-pink-500/20' : 'hover:scale-102'
                  }`}>
                    <CardContent className="p-8">
                      {/* Feature Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/30">
                          {feature.category}
                        </Badge>
                      </div>

                      {/* Feature Content */}
                      <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                      <p className="text-purple-200 mb-6 leading-relaxed">{feature.description}</p>

                      {/* Benefits */}
                      <div className="mb-6">
                        <p className="text-sm font-medium text-purple-300 mb-3">Key Benefits:</p>
                        <div className="flex flex-wrap gap-2">
                          {feature.benefits.map((benefit, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-purple-800/50 text-purple-200 border-purple-500/30 text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-500/20">
                        {Object.entries(feature.stats).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <p className="text-lg font-bold text-white">{value}</p>
                            <p className="text-xs text-purple-300 capitalize">{key}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </animated.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section ref={archRef} className="relative z-10 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Built for Scale
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Our distributed architecture ensures maximum performance, security, and reliability at global scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {archTrail.map((style, index) => {
              const item = architectureFeatures[index];
              const IconComponent = item.icon;
              
              return (
                <animated.div key={index} style={style}>
                  <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 backdrop-blur-sm h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-white">{item.title}</h3>
                      <p className="text-sm text-purple-200 leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </animated.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-purple-200 mb-12 max-w-2xl mx-auto">
            Join thousands of traders who have already transformed their trading experience with our revolutionary platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/modern-dashboard">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none text-lg px-8 py-6">
                Start Your Journey
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-purple-400 text-purple-100 hover:bg-purple-800/50 text-lg px-8 py-6">
              Learn More
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}