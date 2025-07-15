#!/bin/bash

# Script de deployment para Hostinger y otros hostings

echo "🚀 Iniciando proceso de deployment..."

# 1. Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# 2. Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# 3. Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --production

# 4. Verificar variables de entorno críticas
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL no está configurado"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY no está configurado"
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  WARNING: STRIPE_SECRET_KEY no está configurado"
fi

# 5. Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error durante el build"
    exit 1
fi

# 6. Verificar que los archivos de build existen
if [ ! -f "dist/index.js" ]; then
    echo "❌ El archivo de servidor no se construyó correctamente"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "❌ Los archivos frontend no se construyeron correctamente"
    exit 1
fi

# 7. Ejecutar migraciones de base de datos
echo "🗄️  Ejecutando migraciones de base de datos..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Error en migraciones de base de datos"
fi

echo "✅ Build completado exitosamente!"
echo "📁 Archivos listos en:"
echo "   - Servidor: dist/index.js"
echo "   - Frontend: dist/public/"
echo ""
echo "🚀 Para iniciar en producción, ejecuta:"
echo "   npm start"
echo ""
echo "🌐 Para deployment en Hostinger:"
echo "   1. Sube todos los archivos vía FTP/Git"
echo "   2. Configura las variables de entorno en el panel"
echo "   3. Configura el comando de inicio: 'npm start'"
echo "   4. Asegúrate de que el puerto esté configurado correctamente"