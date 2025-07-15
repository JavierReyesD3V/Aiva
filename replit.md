# TradingJournal Pro - Replit.md

## Overview

TradingJournal Pro is a comprehensive AI-powered trading analytics application built with a modern full-stack architecture. The application helps traders track, analyze, and improve their trading performance through intelligent insights, gamification, and AI-driven recommendations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with ESM modules
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple
- **External APIs**: OpenAI GPT-4 integration for AI analysis

### Database Schema
The application uses a well-structured PostgreSQL schema with the following main entities:
- `accounts`: Trading account information
- `trades`: Individual trade records with comprehensive metadata
- `userStats`: Gamification and user progress tracking
- `achievements`: Achievement system for user engagement
- `dailyProgress`: Daily trading goal tracking
- `tradeSuggestions`: AI-generated trading recommendations

## Key Components

### Trading Management
- **Trade Import**: CSV file parsing and batch import functionality
- **Manual Trade Entry**: Form-based trade creation with validation
- **Account Management**: Multiple trading account support
- **Real-time Metrics**: Live calculation of trading performance metrics

### AI Integration
- **OpenAI Analysis**: GPT-4 powered trading pattern analysis
- **Smart Suggestions**: AI-generated trading recommendations
- **Interactive Chatbot**: Conversational AI for trading advice
- **Performance Insights**: Automated pattern recognition and feedback

### Gamification System
- **Level Progression**: Points-based user advancement system
- **Achievement Unlocking**: Goal-based reward system
- **Daily Challenges**: Streaks and daily trading objectives
- **Progress Tracking**: Visual representation of user growth

### Analytics & Reporting
- **Performance Metrics**: Comprehensive trading statistics
- **Chart Visualization**: Recharts-based profit/loss tracking
- **Calendar View**: Daily trading performance overview
- **PDF Report Generation**: Automated performance reports

## Data Flow

1. **Trade Data Input**: Users import CSV files or manually enter trades
2. **Data Processing**: Server validates and stores trade data in PostgreSQL
3. **Analytics Engine**: Real-time calculation of metrics and patterns
4. **AI Analysis**: OpenAI processes trading data for insights
5. **Frontend Updates**: TanStack Query manages real-time UI updates
6. **Gamification Updates**: Achievement and progress calculations
7. **Report Generation**: AI-powered comprehensive analysis reports

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL-compatible)
- **AI Services**: OpenAI API for GPT-4 analysis
- **PDF Generation**: Puppeteer for report generation
- **Session Storage**: PostgreSQL for session management

### Development Tools
- **Build System**: Vite with TypeScript support
- **Code Quality**: ESLint and TypeScript compiler
- **UI Framework**: Tailwind CSS with PostCSS processing
- **Component Library**: Radix UI with shadcn/ui styling

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild compiles TypeScript server to `dist/index.js`
- **Database**: Drizzle Kit handles schema migrations
- **Environment**: Node.js production environment with ESM modules

### Environment Configuration
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **AI Services**: `OPENAI_API_KEY` for GPT-4 integration
- **Session**: PostgreSQL-based session storage
- **Build**: Separate development and production configurations

### Development Setup
- **Dev Server**: Express with Vite middleware for HMR
- **Database Sync**: `npm run db:push` for schema synchronization
- **Type Safety**: Shared TypeScript types between client and server
- **Hot Reload**: Full-stack development with live reloading

## User Preferences

Preferred communication style: Simple, everyday language.
Design preference: Dark purple gradient theme with pink/purple accent colors, white text for readability, and elegant card gradients throughout the application.

## Recent Changes

- July 8, 2025: Panel de Administrador Completamente Funcional
  - Sistema completo de administración con roles de usuario (user/admin) 100% funcional
  - Gestión de usuarios: cambiar roles, suspender, reactivar, eliminar - TODAS funcionando
  - Corregido error de eliminación de usuarios manejando referencias de claves foráneas
  - Sistema de códigos promocionales: crear, activar/desactivar, eliminar - TODAS funcionando
  - Analíticas del sistema con métricas en tiempo real y gráficos interactivos
  - Logs de actividad administrativa con registro automático completo
  - Búsqueda de usuarios en tiempo real funcionando correctamente
  - Manejo de errores y validaciones en todos los formularios
  - Panel responsive con navegación condicional solo para administradores
  - Orden de parámetros API corregido para todas las funcionalidades
  - Sistema de eliminación mejorado con limpieza de datos relacionados

- July 4, 2025: Sistema de Header Móvil Integrado Completado en Todas las Páginas
  - Creado componente MobileHeader funcional con diseño profesional integrado
  - Implementado header móvil en TODAS las páginas principales: ModernDashboard, Trades, AIAnalysis, Calendar, MarketAnalysis, Reports, Achievements
  - Sistema elimina botón flotante por diseño más profesional con header nativo móvil
  - Headers integrados muestran título y subtítulo bilingüe de cada sección con hamburger menu
  - Diseño responsive que oculta header móvil en desktop manteniendo headers nativos
  - Headers desktop preservados para mantener funcionalidad completa en pantallas grandes
  - Arquitectura simplificada sin contexto complejo para mayor estabilidad
  - Tema purple/pink gradient consistente en todos los headers móviles
  - Implementación completada: 7 páginas con MobileHeader funcional

- July 4, 2025: Correcciones Específicas de Interfaz Móvil y Optimización Completa
  - Corregido problema de superposición de texto en tabs cambiando de grid a flex en móviles
  - Implementada zona segura para dispositivos con notch/dynamic island con env(safe-area-inset-*)
  - Reducido espacio superior en dashboard manteniendo legibilidad en todos los dispositivos
  - Arreglados botones del menú desplegable del usuario con clases user-dropdown-menu específicas
  - Optimizado componente Tabs con overflow-x-auto y flex-shrink-0 para evitar superposiciones
  - Agregadas optimizaciones CSS específicas para dispositivos móviles con animaciones más rápidas
  - Implementadas áreas de toque más grandes (min-height: 48px) para todos los botones e interacciones
  - Optimizado scroll táctil con -webkit-overflow-scrolling: touch y overscroll-behavior
  - Añadido font-size: 16px para evitar zoom automático en iOS en campos de entrada
  - Mejorado spacing y padding específico para móviles con clases responsive
  - Optimizada navegación del sidebar con touch-manipulation y areas de toque expandidas
  - Reducida complejidad visual con backdrop-blur más ligero para mejor rendimiento
  - Dashboard completamente responsive con grid adaptativo y componentes móvil-first
  - Agregadas memoizaciones de cálculos pesados y consultas optimizadas por tipo de dispositivo

- July 3, 2025: Funcionalidad Sidebar y Cálculo de Métricas Corregido Completamente
  - Configurado contexto UserActions en todas las páginas principales (Trades, Calendar, Markets, Achievements, Reports, AI Analysis)
  - Botones "Nuevo Trade" y "Desvincular CSV" funcionan correctamente en todas las secciones
  - Corregido cálculo de XP y nivel en header del ModernDashboard usando currentPoints en lugar de totalXP
  - Agregada función calculateLevel faltante en ModernDashboard para consistencia
  - Corregido cálculo de Total Profit en endpoints /api/metrics y /api/metrics/summary para incluir commission y swap
  - Métricas de profit ahora coinciden correctamente entre cartas del dashboard y gráfico de rendimiento
  - Sistema de modales TradeForm e ImportModal integrado en todas las páginas con estados correctos

- July 3, 2025: Sistema de Historial de Reportes Implementado y Corregido Completamente
  - Creada tabla report_history en base de datos con esquema completo para persistir historial
  - Implementadas operaciones CRUD para gestión completa del historial de reportes
  - Modificado endpoint /api/reports/html para guardar automáticamente reportes en historial
  - Agregado parámetro 'redownload=true' para evitar duplicados al re-descargar reportes
  - Corregida funcionalidad de descarga desde historial para usar fechas exactas originales
  - Actualizada página Reports con visualización real del historial y opciones de descarga/eliminación
  - Sistema completo permite ver, re-descargar y eliminar reportes del historial sin crear duplicados
  - Nombres de archivo específicos basados en rango de fechas usado (e.g., reporte-trading-2025-07-01-to-2025-07-03.html)

- July 3, 2025: Problema de Autenticación en Generación de Reportes PDF Resuelto
  - Corregido error 401 (Unauthorized) en endpoint /api/reports/html
  - Agregado "credentials: include" en llamadas fetch del frontend para incluir cookies de sesión
  - Añadido middleware isAuthenticated a endpoints /api/reports/pdf y /api/reports/comprehensive-analysis
  - Botón "Generar Reporte PDF Completo" funcionando correctamente en AIAnalysis
  - Sistema de reportes completamente funcional con autenticación adecuada
  - Usuarios autenticados pueden generar reportes sin errores de autorización

- July 3, 2025: Campo de Símbolos en Market Analysis Corregido Completamente
  - Solucionado problema de visibilidad de texto cambiando color de fondo a gray-800
  - Implementada validación de caracteres que solo permite letras y números (A-Z, 0-9)
  - Agregado límite de 100 caracteres con contador visual
  - Validación en tiempo real con mensajes de error descriptivos usando toast
  - Filtrado automático de símbolos inválidos con notificaciones específicas
  - Detección de símbolos duplicados con prevención de adición
  - Máximo 10 caracteres por símbolo individual para cumplir convenciones de mercado
  - Campo completamente funcional y seguro contra caracteres especiales y emojis

- July 3, 2025: Error de React Hooks en TradeDetailsModal Resuelto
  - Corregido error "Rendered more hooks than during the previous render"
  - Movida verificación de null del trade después de todos los hooks
  - Arreglado tipo de userStats con cast (as any) para evitar error TypeScript
  - Modal de cierre de trades funcionando correctamente sin errores de hooks
  - Aplicación estable y funcional para crear y cerrar trades

- July 3, 2025: Funcionalidad de Cierre de Trades Implementada
  - Agregado botón "Cerrar Trade" en modal de detalles para trades abiertos
  - Formulario de cierre con campos para precio de cierre y profit/loss
  - Actualización automática de estado del trade a cerrado con fecha actual
  - Integración completa con sistema de invalidación de caché
  - UI responsive con estilos cohesivos del tema dark purple
  - Reset automático del formulario al cerrar el modal

- July 3, 2025: Error de Creación de Trades Resuelto Completamente
  - Solucionado error "Account not found" incluyendo accountId del trade
  - Corregido manejo de fechas en conversión datetime-local a Date object
  - Añadido fetcheo automático de cuenta activa en TradeForm
  - Estados de carga para prevenir envío sin cuenta activa
  - Creación de trades funciona correctamente en producción

- July 3, 2025: Flujo de Autenticación Login Corregido y Simplificado
  - Resuelto error 404 en /auth-callback que impedía login exitoso
  - Simplificado callback de Replit para redirección directa a /modern-dashboard
  - Restaurado App.tsx con configuración correcta de rutas
  - AuthCallback.tsx configurado como página intermedia para casos especiales
  - Login funciona correctamente: OAuth → Redirección directa → ModernDashboard
  - Eliminado problema de sintaxis JSX que causaba fallos en el servidor

- July 3, 2025: Problema SSL en aivatrade.com Resuelto Completamente
  - Identificado script de desarrollo de Replit causando advertencia SSL en producción
  - Eliminado script problemático "replit-dev-banner.js" de client/index.html
  - SSL funcionando correctamente, verificado con curl en aivatrade.com
  - Deployment en producción con dominio personalizado completamente funcional
  - Guía de troubleshooting SSL creada (replit-deployment-ssl.md)

- July 3, 2025: Botones Sidebar y Logout Arreglados Completamente
  - Confirmado funcionamiento completo de botones del sidebar: "Nuevo Trade", "Desvincular CSV", "Subir CSV"
  - Corregida redirección de logout para usar ModernLanding (/modern-landing) en lugar del landing antiguo
  - UserActionsContext funcionando correctamente con modales TradeForm e ImportModal
  - Servidor reiniciado para resolver problema de puerto ocupado
  - Aplicación funcionando completamente con frontend moderno y funcionalidad completa

- July 3, 2025: Frontend Moderno Animado Inspirado en Vara.network Completado
  - Creado ModernLanding con animaciones de typewriter, elementos flotantes y efectos visuales
  - Implementado ModernDashboard con métricas animadas usando react-spring y intersection observer
  - Desarrollado ModernFeatures con showcase interactivo y efectos hover avanzados
  - Sistema de navegación actualizado con rutas modernas (/modern-dashboard, /features)
  - Agregadas animaciones suaves con react-spring, AOS y efectos de intersección
  - Corregida función formatNumber para manejar valores null/undefined sin errores
  - Diseño responsive móvil con elementos flotantes y gradientes purple/pink
  - Navegación moderna con enlaces a Features y demo en header

- July 2, 2025: Sistema Completo de Logros de Trading Implementado
  - Creado sistema de achievements robusto con 21 logros diversos basados en mejores prácticas de trading
  - Categorías de logros: milestone, performance, streak, risk_management, profit, advanced
  - Inicialización automática de logros cuando el usuario accede por primera vez
  - Detección inteligente de logros ya ganados basado en datos reales de trading CSV
  - Sistema evalúa automáticamente condiciones: win rate, rachas ganadoras, gestión de riesgo, diversificación
  - Página de Achievements actualizada con tema dark purple gradient consistente
  - Tabs funcionales: Unlocked, In Progress, All Achievements con contadores dinámicos
  - 10 logros desbloqueados automáticamente al detectar patrones en datos de trading del usuario
  - Sistema de puntos XP integrado con progression de niveles existente

- July 2, 2025: Sistema de Reportes HTML Profesional con AIVA
  - Implementado generador de reportes HTML con diseño de la aplicación
  - Reportes ahora se generan en formato HTML con estilo dark purple gradient
  - AIVA (IA Virtual Assistant) genera análisis profesional detallado personalizado
  - Diseño responsive con métricas visuales, formato markdown convertido a HTML
  - Análisis detallado de patrones reales basado en datos del usuario
  - Recomendaciones específicas y plan de mejora paso a paso
  - Fallback automático a reporte simple si OpenAI no está disponible
  - Formato HTML con estilos profesionales para mejor presentación
  - Branding completo cambiado de "Análisis IA" a "Análisis AIVA"
  - Integración completa en navegación, reportes y componentes

- July 2, 2025: Eliminación Completa del Paywall - Aplicación 100% Gratuita
  - Eliminadas todas las restricciones premium del middleware de suscripciones
  - Todas las funciones ahora disponibles gratuitamente: análisis IA, reportes avanzados, cuentas ilimitadas, trades ilimitados
  - Removidos middlewares requiresPremium de todas las rutas del servidor
  - Modal premium actualizado para mostrar que todas las funciones son gratis
  - Sistema de códigos promocionales y pagos de Stripe conservado pero no necesario
  - Usuarios ahora tienen acceso completo sin restricciones desde el primer uso

- July 2, 2025: Configuración de Deployment para Hostinger y Hosting Personalizado Completada
  - Creada guía completa de deployment (deployment-guide.md) con pasos detallados
  - Configuración específica para Hostinger (hostinger-setup.md) con troubleshooting
  - Script automatizado de deployment (deploy.sh) para validación y build
  - Actualizada configuración del servidor para usar PORT de entorno dinámico
  - Archivos Dockerfile y .env.example para diferentes opciones de hosting
  - Documentación completa de variables de entorno y configuraciones de producción
  - Instrucciones para configurar SSL, dominios personalizados y webhooks de Stripe
  - Alternativas de hosting incluidas (Vercel, Railway, DigitalOcean) si Hostinger no funciona

- July 2, 2025: Sistema de Códigos Promocionales Implementado
  - Agregado código especial "SUIZO" con 100% descuento limitado a 20 usos
  - Sistema completo de validación de códigos promocionales con límites de uso
  - 6 códigos disponibles: LAUNCH50 (50%), WELCOME25 (25%), SAVE20 (20%), STUDENT30 (30%), EARLY40 (40%), SUIZO (100% - limitado)
  - Tracking en tiempo real de usos de códigos promocionales
  - UI actualizada para mostrar "GRATIS" cuando se aplica descuento del 100%
  - Webhook de Stripe actualizado para incrementar contador de usos al completar pago
  - Endpoint /api/promo-status para consultar estado actual de códigos promocionales

- July 2, 2025: Complete Premium Subscription System with Stripe Integration
  - Implemented full Stripe payment processing with subscription management
  - Added premium user modal that redirects to dedicated payment page
  - Created comprehensive Subscribe page with Elements integration and payment form
  - Added Stripe backend routes for subscription creation and management
  - Extended database schema with stripeCustomerId and stripeSubscriptionId fields
  - Enhanced user subscription limits (Premium: 10,000 trades, 10 accounts vs Freemium: 100 trades, 1 account)
  - Integrated secure payment processing with client and server-side Stripe handling
  - Added premium features showcase with detailed pricing and feature comparison
  - System ready for production deployment with proper payment security measures

- July 1, 2025: Responsive Navigation and Database Connection Fix
  - Fixed critical WebSocket database connection issue by switching to HTTP-based Neon connection
  - Implemented fully responsive sidebar navigation with mobile menu overlay
  - Added mobile hamburger menu button with proper z-index positioning
  - Increased icon sizes in collapsed sidebar from 5x5 to 7x7 for better visibility
  - Added touch-friendly mobile navigation with overlay close functionality
  - Improved desktop tooltip positioning and styling for collapsed sidebar
  - Fixed mobile layout with proper content padding to avoid menu button overlap
  - Application now works seamlessly across all device sizes

- July 1, 2025: Modal State Management Bug Fix
  - Fixed critical bug where account change modal state persisted when switching to CSV unlink modal
  - Added proper useEffect hooks to reset all modal state when modal closes or mode changes
  - Eliminated state pollution between different modal modes (new, change, clear)
  - Modal components now properly reset showAccountForm, selectedFile, and other internal state

- July 1, 2025: Comprehensive Dark Purple Theme Implementation Completed
  - Systematically applied elegant dark purple gradient theme across entire application
  - Updated all pages: Dashboard, Trades, Calendar, Reports, AIAnalysis, MarketAnalysis, Landing
  - Updated all components: Sidebar, MetricsCard, TradingChart, forms, modals, and widgets
  - Implemented consistent purple gradient backgrounds with pink accent colors
  - Applied proper white text contrast for optimal readability in dark environments
  - Updated buttons, cards, tables, selects, and all UI elements with cohesive dark styling
  - Replaced white/gray color scheme with purple gradients throughout application
  - Enhanced visual hierarchy and professional appearance with modern dark design
  - Ensured complete theme consistency across all user-facing components

- July 1, 2025: Dark Purple Theme Implementation
  - Replaced white design with elegant dark purple gradient theme
  - Updated all components to use purple gradient backgrounds and white text
  - Created cohesive dark theme with pink/purple accent colors for buttons and active states
  - Enhanced visual hierarchy with proper contrast for readability
  - Maintained modern aesthetic while improving user experience in low-light environments

- June 30, 2025: OAuth User ID Conflict Resolution - CSV Import Fixed
  - Resolved critical user ID mismatch between OAuth sessions and database records
  - Fixed email conflict handling in user creation process that was causing foreign key violations
  - CSV import now works correctly for all OAuth providers (Google, Apple ID, GitHub)
  - Each OAuth user gets proper data isolation with their unique session ID
  - System handles multiple users seamlessly with complete data separation
  - Fixed upsertUser logic to handle email conflicts without breaking user creation

- June 30, 2025: Complete User Data Isolation and CSV Management System
  - Implemented comprehensive user data isolation to prevent cross-user data visibility
  - Added intelligent CSV data management with clear/unlink functionality
  - Created dynamic UI that adapts based on user's data state (new user vs existing data)
  - Added "Desvincular CSV" button that appears when user has existing data
  - Integrated complete data clearing endpoint that removes all user accounts, trades, and stats
  - Enhanced ImportModal with three modes: new import, change account, and clear data
  - Fixed user authentication flow to create missing users during CSV import
  - All users now see only their own trading data regardless of login method

- June 30, 2025: Critical Database Authentication Fix
  - Fixed foreign key constraint violation during user upsert operations
  - Prevented user ID updates that would break account relationships
  - Added better email conflict handling for existing users
  - Resolved logout/login cycle crashes completely
  - Application now handles session refresh without database errors

- June 30, 2025: Authentication and Landing Page Implementation
  - Created comprehensive landing page for non-authenticated users
  - Implemented logout functionality with "Cerrar Sesión" button in Dashboard header
  - Added user profile display in header showing name, avatar, and current level
  - Modified authentication flow to redirect to landing page after logout
  - Landing page features modern design with white background consistent with app theme
  - Structured routing to handle authenticated vs non-authenticated user flows
  - Added `/landing` route accessible for demo and post-logout scenarios

- June 30, 2025: PostgreSQL Database Transition Completed Successfully
  - Resolved all TypeScript errors in backend routes and storage layer
  - Fixed missing userId parameters in storage method calls
  - Added missing insertTradeSuggestionSchema for trade suggestions
  - Corrected type annotations in Dashboard component queries
  - All main endpoints now responding with 200 OK status
  - Database fully operational with multi-user support and proper session management

- June 30, 2025: Complete transition to white-only design finalized
  - Eliminated dark mode theme system entirely
  - Updated all components to use white background with clean styling
  - Maintained calendar's special transparency and color-changing effects as requested
  - Simplified Sidebar, Dashboard, MetricsCard, TradingChart, and AIAnalysis components
  - Removed theme toggle button and ThemeContext for unified white appearance
  - Fixed final styling issues in Reports page: metrics cards, toggle buttons, and form elements
  - All pages now consistently use white (#ffffff) background with proper text contrast
  - User confirmed no remaining styling adjustments needed

- June 30, 2025: TraderMade API integration implemented successfully
  - Integrated real-time market data from TraderMade API
  - Created comprehensive trading signals system with technical analysis
  - Added MarketOverview widget to Dashboard with live currency quotes
  - Built full Market Analysis page with live data, signals, and watchlist
  - Fixed instrument symbol mapping issue for proper currency pair display
  - Implemented intelligent fallback system with simulated data for API failures
  - Added algorithmic trading signals based on SMA, volatility, and support/resistance

## Changelog

Changelog:
- June 28, 2025. Initial setup
- June 28, 2025. Applied comprehensive white design system