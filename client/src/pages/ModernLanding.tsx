import { useEffect, useState } from 'react';
import { useSpring, animated, useTrail } from 'react-spring';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, BarChart3, TrendingUp, Zap, Shield, Users, ChevronRight, Star } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { Link } from 'wouter';
import Typewriter from 'typewriter-effect';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced artificial intelligence analyzes your trading patterns and provides personalized insights.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Monitor your trading performance with live charts and comprehensive metrics.',
    color: 'from-blue-500 to-purple-500'
  },
  {
    icon: TrendingUp,
    title: 'Smart Suggestions',
    description: 'Receive intelligent trading recommendations based on market analysis.',
    color: 'from-green-500 to-blue-500'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Experience blazing-fast performance with real-time data processing.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Your data is protected with enterprise-grade security measures.',
    color: 'from-red-500 to-pink-500'
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Join thousands of traders sharing insights and strategies.',
    color: 'from-indigo-500 to-purple-500'
  }
];

const stats = [
  { value: '10K+', label: 'Active Traders' },
  { value: '1M+', label: 'Trades Analyzed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' }
];

export default function ModernLanding() {
  const [mounted, setMounted] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    setMounted(true);
  }, []);

  const heroAnimation = useSpring({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0px)' : 'translateY(50px)',
    config: { tension: 280, friction: 60 }
  });

  const trail = useTrail(features.length, {
    opacity: featuresInView ? 1 : 0,
    transform: featuresInView ? 'translateY(0px)' : 'translateY(50px)',
    config: { tension: 280, friction: 60 }
  });

  const statsAnimation = useSpring({
    opacity: statsInView ? 1 : 0,
    transform: statsInView ? 'scale(1)' : 'scale(0.8)',
    config: { tension: 280, friction: 60 }
  });

  const floatingAnimation = useSpring({
    from: { transform: 'translateY(0px)' },
    to: async (next) => {
      while (true) {
        await next({ transform: 'translateY(-10px)' });
        await next({ transform: 'translateY(0px)' });
      }
    },
    config: { duration: 4000, tension: 120, friction: 40 }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-sm bg-black/30 border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              TradingJournal Pro
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features">
              <Button variant="ghost" className="text-purple-200 hover:text-white hover:bg-purple-800/50">
                Features
              </Button>
            </Link>
            <Button variant="ghost" className="text-purple-200 hover:text-white hover:bg-purple-800/50">
              Demo
            </Button>
            <Button variant="ghost" className="text-purple-200 hover:text-white hover:bg-purple-800/50">
              Pricing
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => window.location.href = '/api/auth/google'}
              className="bg-white hover:bg-gray-100 text-gray-700 border-none flex items-center space-x-2"
            >
              <SiGoogle className="w-4 h-4" />
              <span>Google</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <animated.div style={heroAnimation} className="text-center z-10 max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Transform Your Trading
            </h1>
            <div className="text-2xl md:text-4xl font-semibold mb-8 text-purple-100">
              <Typewriter
                options={{
                  strings: [
                    'with AI-Powered Analytics',
                    'with Smart Insights',
                    'with AIVA Assistant',
                    'with Real-Time Data'
                  ],
                  autoStart: true,
                  loop: true,
                  delay: 50,
                  deleteSpeed: 30
                }}
              />
            </div>
            <p className="text-xl md:text-2xl mb-12 text-purple-200 max-w-3xl mx-auto leading-relaxed">
              Join thousands of traders who trust our advanced AI system to analyze their performance, 
              discover patterns, and unlock their full trading potential.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none text-lg px-8 py-6"
              >
                Start Trading Journey
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/auth/google'}
                className="bg-white hover:bg-gray-100 text-gray-700 border-none flex items-center space-x-2 text-lg px-8 py-6"
              >
                <SiGoogle className="w-5 h-5" />
                <span>Continue with Google</span>
              </Button>
            </div>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-purple-400 text-purple-100 hover:bg-purple-800/50 text-lg px-8 py-6">
                Explore Features
              </Button>
            </Link>
          </div>
        </animated.div>

        {/* Floating Elements */}
        <animated.div style={floatingAnimation} className="absolute top-20 right-20 hidden lg:block">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </animated.div>
        
        <animated.div style={floatingAnimation} className="absolute bottom-32 left-20 hidden lg:block">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
        </animated.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 px-4">
        <animated.div style={statsAnimation} className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-purple-200 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </animated.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Discover the advanced tools that make TradingJournal Pro the choice of professional traders worldwide.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {trail.map((style, index) => {
              const feature = features[index];
              const IconComponent = feature.icon;
              return (
                <animated.div key={index} style={style}>
                  <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                      <p className="text-purple-200 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </animated.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ready to Transform Your Trading?
            </h2>
            <p className="text-xl text-purple-200 mb-12 max-w-2xl mx-auto">
              Join our community of successful traders and start your journey to better trading performance today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none text-lg px-8 py-6"
              >
                Get Started Now
                <Star className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/auth/google'}
                className="bg-white hover:bg-gray-100 text-gray-700 border-none flex items-center space-x-2 text-lg px-8 py-6"
              >
                <SiGoogle className="w-5 h-5" />
                <span>Continue with Google</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              TradingJournal Pro
            </span>
          </div>
          <p className="text-purple-200 mb-4">
            Empowering traders with AI-driven insights and analytics.
          </p>
          <p className="text-purple-300 text-sm">
            © 2025 TradingJournal Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}