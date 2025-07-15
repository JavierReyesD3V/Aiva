# Configuración Específica para Hostinger

## Pasos Detallados para Hostinger

### 1. Configuración en Panel de Hostinger

#### A. Crear Aplicación Node.js
1. Entra a tu panel de Hostinger
2. Ve a "Website" → "Manage"
3. Selecciona "Node.js App" o "Advanced" → "Node.js"
4. Crea nueva aplicación con:
   - **Node.js Version**: 18.x o superior
   - **Startup File**: `dist/index.js`
   - **Document Root**: `public_html` o la carpeta asignada

#### B. Variables de Entorno
En la sección "Environment Variables":
```
DATABASE_URL=tu_url_de_neon_database
OPENAI_API_KEY=tu_openai_key
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
NODE_ENV=production
SESSION_SECRET=tu_secret_muy_seguro_aqui
```

### 2. Subir Archivos

#### Opción A: Git (Recomendado)
```bash
# En tu computadora local
git init
git add .
git commit -m "Deploy to Hostinger"

# Conectar con el repositorio de Hostinger si está disponible
# O usar Git deploy que ofrece Hostinger
```

#### Opción B: File Manager
1. Accede al File Manager de Hostinger
2. Navega a la carpeta de tu dominio (`public_html` normalmente)
3. Sube todos los archivos del proyecto:
   - `package.json`
   - `package-lock.json`
   - Carpetas: `server/`, `client/`, `shared/`, `dist/`
   - Archivos de configuración

### 3. Instalación y Build

#### En Terminal de Hostinger:
```bash
# Navegar a la carpeta del proyecto
cd public_html

# Instalar dependencias
npm install

# Construir la aplicación
npm run build

# Ejecutar migraciones
npm run db:push
```

### 4. Configurar Comando de Inicio
En el panel de Node.js de Hostinger:
- **Startup File**: `dist/index.js`
- **Startup Command**: `node dist/index.js`

### 5. Configurar Dominio

#### A. Dominio Principal
Si usas el dominio principal de Hostinger, la aplicación estará disponible directamente.

#### B. Subdominio
1. Crea un subdominio en el panel
2. Apunta el subdominio a la carpeta de la aplicación
3. Configura SSL (incluido gratis en Hostinger)

### 6. Configuración de Stripe para Producción

#### A. Cambiar a Claves Live
1. Ve a tu dashboard de Stripe
2. Cambia de "Test" a "Live"
3. Actualiza las variables de entorno:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `VITE_STRIPE_PUBLIC_KEY=pk_live_...`

#### B. Configurar Webhooks
1. En Stripe, ve a Developers → Webhooks
2. Crea un nuevo endpoint:
   - URL: `https://tudominio.com/api/stripe/webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 7. Verificaciones Post-Deployment

#### A. Funcionalidad Básica
- [ ] La aplicación carga correctamente
- [ ] El login funciona
- [ ] El dashboard muestra datos
- [ ] Las rutas API responden

#### B. Funcionalidad de Pagos
- [ ] Los códigos promocionales funcionan
- [ ] El checkout de Stripe carga
- [ ] Los pagos se procesan correctamente
- [ ] Los webhooks funcionan

#### C. Base de Datos
- [ ] Las conexiones funcionan
- [ ] Los datos se guardan correctamente
- [ ] Las migraciones se aplicaron

### 8. Optimizaciones Recomendadas

#### A. Performance
- Habilita compresión gzip en Hostinger
- Configura caching para archivos estáticos
- Optimiza imágenes si las hay

#### B. Seguridad
- Verifica que SSL esté habilitado
- Revisa que las variables de entorno no se expongan
- Configura headers de seguridad (ya incluidos en la app)

#### C. Monitoreo
- Configura logs en Hostinger
- Monitorea el uso de recursos
- Configura alertas si están disponibles

### 9. Troubleshooting Común

#### Problema: "Cannot find module"
**Solución**: Asegúrate de ejecutar `npm install` en el servidor

#### Problema: "Port already in use"
**Solución**: Hostinger asigna puertos automáticamente, no especifiques uno fijo

#### Problema: "Database connection failed"
**Solución**: Verifica que `DATABASE_URL` esté correctamente configurado

#### Problema: "Stripe not working"
**Solución**: 
- Verifica las claves de Stripe en variables de entorno
- Asegúrate de usar claves live para producción
- Configura los webhooks correctamente

### 10. Contacto Soporte

Si tienes problemas específicos con Hostinger:
1. Revisa la documentación de Hostinger sobre Node.js
2. Contacta al soporte de Hostinger con los logs de error
3. Verifica que tu plan incluye aplicaciones Node.js

### 11. Alternativas si Hostinger no Funciona

Si encuentras limitaciones en Hostinger:
- **Vercel**: Muy fácil para apps full-stack
- **Railway**: Excelente para aplicaciones con base de datos
- **DigitalOcean App Platform**: Más control y escalabilidad
- **AWS Amplify**: Si necesitas escalabilidad enterprise