# Guía SSL para Replit Deployments con Dominio Personalizado

## Problemas SSL Comunes en Replit

### 1. Verificar Estado del Deployment
1. Ve a tu deployment en Replit
2. Revisa que esté en estado "Running"
3. Verifica que no haya errores en los logs

### 2. Configuración DNS Correcta
Para que SSL funcione con dominios personalizados:

```
Tipo: CNAME
Nombre: @ (o tu subdominio)
Valor: tu-deployment-name.replit.app
TTL: 300 (o automático)
```

### 3. Configuración en Replit
1. En tu deployment, ve a "Settings"
2. En "Custom Domain" agrega tu dominio
3. Espera a que aparezca "SSL Certificate: Active"

### 4. Soluciones Específicas

#### Problema: "SSL Certificate Not Found"
```bash
# Verifica que el dominio esté correctamente configurado
nslookup tu-dominio.com
```

#### Problema: "Mixed Content"
Asegúrate de que todas las URLs internas usen HTTPS:
- Cambia URLs absolutas por relativas
- Verifica configuración de Stripe para HTTPS
- Revisa webhooks y callbacks

### 5. Configuración del Servidor para SSL
El servidor ya está configurado para production con HTTPS:

```javascript
// Ya configurado en server/index.ts
app.set('trust proxy', 1); // Para HTTPS detrás de proxy
```

### 6. Variables de Entorno para Producción
Asegúrate de tener estas variables en Replit Secrets:

```
NODE_ENV=production
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_... (usar live keys)
VITE_STRIPE_PUBLIC_KEY=pk_live_... (usar live keys)
```

### 7. Troubleshooting SSL

#### Verificar SSL:
```bash
# Comando para verificar SSL
curl -I https://tu-dominio.com
```

#### Si SSL no funciona:
1. **Elimina y vuelve a agregar el dominio** en Replit
2. **Verifica DNS**: Usa herramientas como DNS Checker
3. **Espera 24-48 horas** para propagación completa
4. **Contacta soporte de Replit** si persiste

### 8. Configuración Stripe para HTTPS
Actualiza en Stripe Dashboard:
- Webhook endpoints a HTTPS
- Redirect URLs a HTTPS
- Test/Live mode según corresponda

### 9. Headers de Seguridad
Ya implementados en el servidor:
```javascript
// En server/index.ts
app.use(helmet()); // Headers de seguridad
```

## Problema Común: Script de Desarrollo de Replit

**SOLUCIÓN PARA aivatrade.com:**
El problema era el script de desarrollo en `client/index.html`:
```html
<!-- ELIMINAR ESTE SCRIPT PARA PRODUCCIÓN -->
<script src="https://replit.com/public/js/replit-dev-banner.js"></script>
```

Este script causa problemas de SSL en producción. **YA ELIMINADO**.

## Pasos de Diagnóstico

1. **Verifica el deployment está funcionando**: `https://tu-deployment.replit.app`
2. **Revisa DNS**: Herramientas online como whatsmydns.net
3. **Prueba SSL**: ssllabs.com/ssltest/
4. **Verifica logs** del deployment en Replit
5. **Confirma variables** de entorno están configuradas

## Contacto Soporte
Si ninguna solución funciona:
- Contacta soporte de Replit directamente
- Proporciona: dominio, deployment name, logs de error