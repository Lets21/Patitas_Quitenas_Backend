/**
 * Script para probar el envío de emails en producción
 * Ejecutar con: npx ts-node tools/testEmail.ts
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('🧪 Iniciando prueba de email...\n');
  
  // Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NO CONFIGURADO');
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NO CONFIGURADO');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ NO CONFIGURADO');
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ CONFIGURADO (oculto)' : '❌ NO CONFIGURADO');
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NO CONFIGURADO');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ ERROR: EMAIL_USER o EMAIL_PASSWORD no están configurados');
    process.exit(1);
  }

  try {
    // Crear transportador
    console.log('🔧 Creando transportador de email...');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      requireTLS: true
    });

    // Verificar conexión
    console.log('🔌 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa!\n');

    // Enviar email de prueba
    console.log('📧 Enviando email de prueba...');
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Test'}" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: '🧪 Test de Email - Huellitas Quiteñas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
          <div style="background-color: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">✅ Email Funcionando!</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px;">
              <strong>¡Excelente noticia!</strong> El sistema de notificaciones está configurado correctamente.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Este email de prueba confirma que:
            </p>
            <ul style="color: #374151;">
              <li>✅ Las credenciales de Gmail son correctas</li>
              <li>✅ La conexión SMTP funciona</li>
              <li>✅ El servidor puede enviar emails</li>
            </ul>
            <p style="color: #374151; margin-top: 20px;">
              <strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}<br>
              <strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      `,
      text: `✅ Test de Email - Sistema de notificaciones funcionando correctamente!`
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📬 Message ID:', info.messageId);
    console.log('\n✨ Todo está funcionando correctamente!');
    
  } catch (error: any) {
    console.error('\n❌ ERROR al enviar email:');
    console.error('Tipo:', error.name);
    console.error('Mensaje:', error.message);
    if (error.code) console.error('Código:', error.code);
    if (error.response) console.error('Respuesta:', error.response);
    console.error('\n📝 Detalles completos:');
    console.error(error);
    process.exit(1);
  }
}

testEmail();
