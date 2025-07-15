import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Shield, 
  Target, 
  Award,
  ChevronRight,
  Users,
  Globe,
  Zap
} from "lucide-react";
import { SiGoogle } from 'react-icons/si';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-purple bg-card-gradient/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TradePro</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
              >
                Iniciar Sesión
              </Button>
              <Button
                onClick={() => window.location.href = '/api/auth/google'}
                className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 flex items-center space-x-2"
              >
                <SiGoogle className="w-4 h-4" />
                <span>Google</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Transforma tu Trading con
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent block">Inteligencia Artificial</span>
            </h1>
            <p className="text-xl text-purple-light mb-8 max-w-3xl mx-auto">
              Analiza tu rendimiento, identifica patrones y mejora tus estrategias de trading 
              con nuestro journal inteligente impulsado por IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.location.href = '/api/login'}
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
                >
                  Comenzar Gratis
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={() => window.location.href = '/api/auth/google'}
                  size="lg"
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 flex items-center space-x-2 px-8 py-3"
                >
                  <SiGoogle className="w-5 h-5" />
                  <span>Continuar con Google</span>
                </Button>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-300 text-gray-700 px-8 py-3"
              >
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Características Poderosas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas para llevar tu trading al siguiente nivel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Análisis con IA",
                description: "Obtén insights profundos sobre tus patrones de trading con análisis impulsado por inteligencia artificial."
              },
              {
                icon: BarChart3,
                title: "Métricas Avanzadas",
                description: "Visualiza tu rendimiento con gráficos interactivos y métricas detalladas en tiempo real."
              },
              {
                icon: Target,
                title: "Sugerencias Inteligentes",
                description: "Recibe recomendaciones personalizadas para mejorar tu estrategia de trading."
              },
              {
                icon: Shield,
                title: "Gestión de Riesgo",
                description: "Herramientas avanzadas para monitorear y controlar el riesgo de tus operaciones."
              },
              {
                icon: Award,
                title: "Sistema de Logros",
                description: "Mantente motivado con un sistema de gamificación y seguimiento de progreso."
              },
              {
                icon: Globe,
                title: "Datos de Mercado",
                description: "Acceso a datos de mercado en tiempo real y análisis técnico automatizado."
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Resultados Comprobados
            </h2>
            <p className="text-xl text-gray-600">
              Miles de traders ya confían en nuestra plataforma
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: "10,000+", label: "Traders Activos" },
              { number: "1M+", label: "Trades Analizados" },
              { number: "35%", label: "Mejora Promedio" },
              { number: "4.9/5", label: "Calificación" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-500 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para Transformar tu Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a miles de traders que ya están mejorando su rendimiento con TradingJournal Pro.
          </p>
          <Button
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-white text-blue-500 hover:bg-gray-100 px-8 py-3"
          >
            Comenzar Ahora
            <Zap className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">TradingJournal Pro</span>
              </div>
              <p className="text-gray-400">
                La plataforma más avanzada para análisis de trading con inteligencia artificial.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Características</li>
                <li>Precios</li>
                <li>Integraciones</li>
                <li>API</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentación</li>
                <li>Guías</li>
                <li>Centro de Ayuda</li>
                <li>Contacto</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Acerca de</li>
                <li>Blog</li>
                <li>Carreras</li>
                <li>Privacidad</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TradingJournal Pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}