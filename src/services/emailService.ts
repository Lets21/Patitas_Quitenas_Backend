import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import sgMail from "@sendgrid/mail";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type EmailProvider = "sendgrid" | "resend" | "smtp" | "none";

class EmailService {
  private transporter: Transporter | null = null;
  private resend: Resend | null = null;
  private provider: EmailProvider = "none";
  private readonly LOGO_URL = "https://res.cloudinary.com/dctbi0fol/image/upload/v1764096455/emails/logo_huellitas.png";

  constructor() {
    this.initializeEmailService();
  }

  /**
   * Genera el header HTML común para todos los emails
   */
  private getEmailHeader(gradientColors: string = "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"): string {
    return `
      <div style="background: ${gradientColors}; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="${this.LOGO_URL}" alt="Huellitas Quiteñas" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%; background: white; padding: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Huellitas Quiteñas</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 13px;">Protegiendo y cuidando a nuestros amigos de cuatro patas</p>
      </div>
    `;
  }

  /**
   * Genera estilos CSS comunes para emails
   */
  private getEmailStyles(): string {
    return `
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #1f2937;
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
        }
        .container { 
          max-width: 600px; 
          margin: 15px auto; 
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .content { 
          padding: 25px 20px;
        }
        .content p {
          color: #374151;
          font-size: 15px;
          line-height: 1.6;
          margin: 10px 0;
        }
        .highlight-box { 
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-left: 4px solid #2563eb;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .info-box {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }
        .score-badge { 
          display: inline-block;
          padding: 8px 16px;
          background-color: #10b981;
          color: #ffffff;
          border-radius: 20px;
          font-weight: bold;
          font-size: 16px;
          text-decoration: none;
        }
        .button { 
          display: inline-block;
          padding: 14px 32px;
          background-color: #4F46E5;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          margin: 15px 0;
          font-weight: 600;
          font-size: 15px;
        }
        .button:visited { color: #ffffff; }
        .button:hover { color: #ffffff; background-color: #4338ca; }
        .footer { 
          background-color: #f9fafb;
          text-align: center;
          padding: 20px 15px;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .footer a {
          color: #4F46E5;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
          margin: 20px 0;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 10px 0;
        }
        ul li {
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
        }
        ul li:last-child {
          border-bottom: none;
        }
        h2 {
          margin: 0 0 15px 0;
          color: #1f2937;
        }
        strong {
          color: #1f2937;
          font-weight: 600;
        }
        ol li {
          color: #374151;
        }
      </style>
    `;
  }

  private initializeEmailService() {
    console.log('🔧 Inicializando EmailService...');
    console.log('📋 Verificando proveedores de email disponibles...');
    
    // Prioridad 1: SendGrid (funciona sin dominio propio, 100 emails/día gratis)
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (sendgridApiKey) {
      try {
        sgMail.setApiKey(sendgridApiKey);
        this.provider = "sendgrid";
        console.log("✅ Servicio de email configurado con SendGrid");
        console.log("   ℹ️  SendGrid permite enviar a CUALQUIER email sin restricciones");
        console.log("   API Key:", sendgridApiKey.substring(0, 12) + "...");
        return;
      } catch (error: any) {
        console.error("❌ Error al configurar SendGrid:", error.message);
        console.log("   Intentando siguiente proveedor...");
      }
    }

    // Prioridad 2: Resend (requiere dominio verificado, 3000 emails/mes gratis)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        this.resend = new Resend(resendApiKey);
        this.provider = "resend";
        console.log("✅ Servicio de email configurado con Resend");
        console.log("   ⚠️  Resend requiere dominio verificado para enviar a cualquier email");
        console.log("   API Key:", resendApiKey.substring(0, 10) + "...");
        return;
      } catch (error: any) {
        console.error("❌ Error al configurar Resend:", error.message);
        console.log("   Intentando siguiente proveedor...");
      }
    }

    // Prioridad 3: SMTP tradicional (Gmail) - puede estar bloqueado en Render
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
    const emailPort = parseInt(process.env.EMAIL_PORT || "587");

    if (!emailUser || !emailPass) {
      console.error("❌ CRITICAL: Ningún proveedor de email configurado.");
      console.error("   Opciones disponibles:");
      console.error("   1. SENDGRID_API_KEY (recomendado para Render)");
      console.error("   2. RESEND_API_KEY (requiere dominio verificado)");
      console.error("   3. EMAIL_USER + EMAIL_PASSWORD (puede estar bloqueado en Render)");
      return;
    }

    console.log('📋 Intentando configurar SMTP:');
    console.log('   - EMAIL_USER:', emailUser);
    console.log('   - EMAIL_HOST:', emailHost);
    console.log('   - EMAIL_PORT:', emailPort);
    console.log('   ⚠️  SMTP puede estar bloqueado en plataformas cloud como Render');

    try {
      const useSSL = emailPort === 465;
      
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: useSSL,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      this.provider = "smtp";
      console.log("✅ SMTP configurado");
      console.log(`   Puerto: ${emailPort}, SSL: ${useSSL}`);
    } catch (error: any) {
      console.error("❌ Error al configurar SMTP:", error.message);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log('🔍 sendEmail llamado con:', { to: options.to, subject: options.subject });
    console.log('   Proveedor activo:', this.provider);
    
    switch (this.provider) {
      case "sendgrid":
        return this.sendEmailWithSendGrid(options);
      case "resend":
        return this.sendEmailWithResend(options);
      case "smtp":
        return this.sendEmailWithSMTP(options);
      default:
        console.error("❌ No hay proveedor de email configurado");
        return false;
    }
  }

  private async sendEmailWithSendGrid(options: EmailOptions): Promise<boolean> {
    console.log('✓ Usando SendGrid para enviar email...');

    try {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || "noreply@example.com";
      const fromName = process.env.EMAIL_FROM_NAME || "Huellitas Quiteñas";

      console.log('📤 Enviando email desde:', `${fromName} <${fromEmail}>`);
      console.log('📬 Enviando email hacia:', options.to);

      await sgMail.send({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
        trackingSettings: {
          clickTracking: { enable: false, enableText: false }
        }
      });

      console.log("✅ Email enviado exitosamente con SendGrid!");
      return true;
    } catch (error: any) {
      console.error("❌ ERROR al enviar email con SendGrid:");
      console.error("   Mensaje:", error.message);
      if (error.response) {
        console.error("   Response body:", error.response.body);
      }
      console.error("   Stack:", error.stack);
      return false;
    }
  }

  private async sendEmailWithResend(options: EmailOptions): Promise<boolean> {
    if (!this.resend) {
      console.error("❌ Resend no configurado");
      return false;
    }

    console.log('✓ Usando Resend para enviar email...');

    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER || "onboarding@resend.dev";
      const fromName = process.env.EMAIL_FROM_NAME || "Huellitas Quiteñas";

      console.log('📤 Enviando email desde:', `${fromName} <${fromEmail}>`);
      console.log('📬 Enviando email hacia:', options.to);

      const result = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.error) {
        console.error("❌ Error de Resend:", result.error);
        return false;
      }

      console.log("✅ Email enviado exitosamente con Resend!");
      console.log("   Email ID:", result.data?.id);
      return true;
    } catch (error: any) {
      console.error("❌ ERROR al enviar email con Resend:");
      console.error("   Mensaje:", error.message);
      console.error("   Stack:", error.stack);
      return false;
    }
  }

  private async sendEmailWithSMTP(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error("❌ CRITICAL: SMTP no configurado");
      return false;
    }

    console.log('✓ Usando SMTP para enviar email...');
    
    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || "Huellitas Quiteñas"}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };
      
      console.log('📤 Enviando email desde:', mailOptions.from);
      console.log('📬 Enviando email hacia:', mailOptions.to);
      
      const info = await this.transporter.sendMail(mailOptions);

      console.log("✅ Email enviado exitosamente con SMTP!");
      console.log("   Message ID:", info.messageId);
      return true;
    } catch (error: any) {
      console.error("❌ ERROR al enviar email con SMTP:");
      console.error("   Mensaje:", error.message);
      console.error("   Código:", error.code);
      console.error("   Command:", error.command);
      return false;
    }
  }

  async sendContactNotification(data: {
    name: string;
    email: string;
    phone?: string;
    destination?: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const adminEmail =
      process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || process.env.EMAIL_USER;

    if (!adminEmail) {
      console.warn("No hay email de administrador configurado");
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .field {
              margin-bottom: 15px;
            }
            .label {
              font-weight: bold;
              color: #4F46E5;
              display: block;
              margin-bottom: 5px;
            }
            .value {
              padding: 10px;
              background-color: #f5f5f5;
              border-left: 3px solid #4F46E5;
              border-radius: 4px;
            }
            .message-box {
              background-color: #f0f4ff;
              padding: 15px;
              border-radius: 8px;
              margin-top: 10px;
              white-space: pre-wrap;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐾 Nuevo Mensaje de Contacto</h1>
            </div>
            <div class="content">
              <p>Has recibido un nuevo mensaje de contacto desde tu sitio web:</p>
              
              <div class="field">
                <span class="label">👤 Nombre:</span>
                <div class="value">${data.name}</div>
              </div>

              <div class="field">
                <span class="label">📧 Email:</span>
                <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
              </div>

              ${
                data.phone
                  ? `
              <div class="field">
                <span class="label">📱 Teléfono:</span>
                <div class="value"><a href="tel:${data.phone}">${data.phone}</a></div>
              </div>
              `
                  : ""
              }

              ${
                data.destination
                  ? `
              <div class="field">
                <span class="label">📍 Destino:</span>
                <div class="value">${data.destination}</div>
              </div>
              `
                  : ""
              }

              <div class="field">
                <span class="label">📋 Asunto:</span>
                <div class="value">${data.subject}</div>
              </div>

              <div class="field">
                <span class="label">💬 Mensaje:</span>
                <div class="message-box">${data.message}</div>
              </div>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p style="color: #666; font-size: 14px;">
                <strong>💡 Consejo:</strong> Responde lo antes posible para brindar un mejor servicio al cliente.
              </p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático generado por tu sistema de gestión.</p>
              <p>Huellitas Quiteñas © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Nuevo Mensaje de Contacto

Nombre: ${data.name}
Email: ${data.email}
${data.phone ? `Teléfono: ${data.phone}` : ""}
${data.destination ? `Destino: ${data.destination}` : ""}
Asunto: ${data.subject}

Mensaje:
${data.message}
    `.trim();

    return this.sendEmail({
      to: adminEmail,
      subject: `🐾 Nuevo mensaje de contacto: ${data.subject}`,
      html,
      text,
    });
  }

  // ========================
  // NOTIFICACIONES PARA ADOPTANTES
  // ========================

  /**
   * Envía email de confirmación al registrarse
   */
  async sendWelcomeEmail(data: {
    to: string;
    name: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          ${this.getEmailStyles()}
        </head>
        <body>
          <div class="container">
            ${this.getEmailHeader()}
            
            <div class="content">
              <h2 style="color: #4F46E5; margin: 0 0 15px 0; font-size: 22px; text-align: center;">🐾 ¡Bienvenido a Huellitas Quiteñas!</h2>
              
              <p>Hola <strong>${data.name}</strong>,</p>
              
              <p>¡Gracias por unirte a nuestra comunidad! Estamos emocionados de que formes parte de nuestra misión de encontrar hogares amorosos para nuestros peluditos.</p>
              
              <p style="margin: 15px 0 10px 0; font-weight: 600; color: #1f2937;">¿Qué puedes hacer ahora?</p>
              <ul style="list-style: none; padding: 0; margin: 10px 0;">
                <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;">🔍 Explora nuestro catálogo de animales disponibles</li>
                <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;">📝 Completa tu perfil y preferencias</li>
                <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;">💖 Solicita la adopción de tu compañero ideal</li>
                <li style="padding: 10px 0; color: #374151;">📞 Contáctanos si tienes alguna duda</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://huellitasquitenas.vercel.app/catalog" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
                  Ver Animales Disponibles
                </a>
              </div>

              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>💡 Tip:</strong> Completa tus preferencias de adopción para que podamos recomendarte los mejores compañeros según tu estilo de vida.</p>
              </div>

              <div class="divider"></div>

              <p style="color: #374151;">Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!</p>
              
              <p style="text-align: center; color: #4b5563; font-size: 13px; margin: 10px 0;">Con cariño,<br><strong style="color: #4F46E5;">El equipo de Huellitas Quiteñas</strong> 🐾</p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0; color: #4b5563;">Este es un correo automático, por favor no responder directamente.</p>
              <p style="margin: 0; color: #374151;">
                <a href="https://huellitasquitenas.vercel.app" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Huellitas Quiteñas</a> © ${new Date().getFullYear()}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Protegiendo y cuidando a nuestros amigos de cuatro patas 🐾
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
¡Bienvenido a Patitas Quiteñas!

Hola ${data.name},

¡Gracias por unirte a nuestra comunidad! Estamos emocionados de que formes parte de nuestra misión de encontrar hogares amorosos para nuestros peluditos.

¿Qué puedes hacer ahora?
- Explora nuestro catálogo de animales disponibles
- Completa tu perfil y preferencias
- Solicita la adopción de tu compañero ideal
- Contáctanos si tienes alguna duda

Si tienes alguna pregunta, no dudes en contactarnos.

Con cariño,
El equipo de Huellitas Quiteñas
    `.trim();

    return this.sendEmail({
      to: data.to,
      subject: "🐾 ¡Bienvenido a Patitas Quiteñas!",
      html,
      text,
    });
  }

  /**
   * Envía confirmación de solicitud de adopción enviada
   */
  async sendApplicationSubmittedEmail(data: {
    to: string;
    adopterName: string;
    animalName: string;
    applicationId: string;
    score: number;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${this.getEmailStyles()}
        </head>
        <body>
          <div class="container">
            ${this.getEmailHeader("linear-gradient(135deg, #10B981 0%, #059669 100%)")}
            
            <div class="content">
              <h2 style="color: #10B981; margin: 0 0 15px 0; font-size: 22px; text-align: center;">✅ ¡Solicitud Enviada Exitosamente!</h2>
              
              <p>Hola <strong>${data.adopterName}</strong>,</p>
              
              <p>¡Excelentes noticias! Tu solicitud de adopción ha sido enviada correctamente.</p>

              <div class="info-box" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10B981; padding: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #065f46;">📋 Detalles de tu solicitud:</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #065f46;"><strong>Animal:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; text-align: right; color: #064e3b;">${data.animalName} 🐕</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #065f46;"><strong>ID de Solicitud:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; text-align: right; color: #064e3b;">#${data.applicationId.slice(-8).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #065f46;"><strong>Compatibilidad:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; text-align: right;"><span style="display: inline-block; padding: 8px 16px; background-color: #10b981; color: #ffffff; border-radius: 20px; font-weight: bold; font-size: 16px; text-decoration: none; font-family: Arial, sans-serif;">${data.score}%</span></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46;"><strong>Fecha:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #064e3b;">${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</td>
                  </tr>
                </table>
              </div>

              <p style="margin: 15px 0 10px 0; font-weight: 600; color: #1f2937;">¿Qué sigue ahora?</p>
              <ol style="line-height: 1.8; color: #374151; margin: 10px 0; padding-left: 20px; font-size: 15px;">
                <li style="margin: 5px 0;">📨 La fundación revisará tu solicitud</li>
                <li style="margin: 5px 0;">🏠 Pueden programar una visita domiciliaria</li>
                <li style="margin: 5px 0;">✅ Recibirás una notificación con la decisión</li>
              </ol>

              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 12px 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0;">
                <p style="margin: 0; color: #78350f; font-size: 14px; font-weight: 500;"><strong>⏳ Tiempo de respuesta:</strong> Normalmente las fundaciones responden en 3-5 días hábiles. Te notificaremos por correo cuando haya novedades.</p>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="https://huellitasquitenas.vercel.app/mis-solicitudes" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
                  📱 Ver Estado de mi Solicitud
                </a>
              </div>

              <p style="text-align: center; color: #4b5563; font-size: 14px; margin: 10px 0;">Mientras tanto, puedes revisar el estado de tu solicitud en cualquier momento desde tu panel de usuario.</p>

              <div class="divider"></div>
              
              <p style="text-align: center; margin: 10px 0; color: #1f2937; font-size: 15px;">¡Te deseamos mucha suerte! 🍀</p>
              
              <p style="text-align: center; color: #4b5563; font-size: 13px; margin: 10px 0;">Con cariño,<br><strong style="color: #4F46E5;">El equipo de Huellitas Quiteñas</strong> 🐾</p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0; color: #4b5563;">Este es un correo automático, por favor no responder directamente.</p>
              <p style="margin: 0; color: #374151;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Huellitas Quiteñas</a> © ${new Date().getFullYear()}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Protegiendo y cuidando a nuestros amigos de cuatro patas 🐾
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
¡Solicitud Enviada Exitosamente!

Hola ${data.adopterName},

¡Excelentes noticias! Tu solicitud de adopción ha sido enviada correctamente.

Detalles de tu solicitud:
- Animal: ${data.animalName}
- ID de Solicitud: #${data.applicationId.slice(-8).toUpperCase()}
- Puntuación de Compatibilidad: ${data.score}%
- Fecha: ${new Date().toLocaleDateString("es-ES", { dateStyle: "full" })}

¿Qué sigue ahora?
1. La fundación revisará tu solicitud
2. Pueden programar una visita domiciliaria
3. Recibirás una notificación con la decisión

Tiempo de respuesta: Normalmente las fundaciones responden en 3-5 días hábiles.

¡Te deseamos mucha suerte!

Con cariño,
El equipo de Huellitas Quiteñas
    `.trim();

    return this.sendEmail({
      to: data.to,
      subject: `✅ Solicitud de adopción enviada - ${data.animalName}`,
      html,
      text,
    });
  }

  /**
   * Envía notificación de solicitud APROBADA
   */
  async sendApplicationApprovedEmail(data: {
    to: string;
    adopterName: string;
    animalName: string;
    applicationId: string;
    foundationContact?: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          ${this.getEmailStyles()}
        </head>
        <body>
          <div class="container">
            ${this.getEmailHeader("linear-gradient(135deg, #10B981 0%, #059669 100%)")}
            
            <div class="content">
              <h2 style="color: #10B981; margin: 0 0 15px 0; font-size: 26px; text-align: center;">🎉 ¡FELICITACIONES!</h2>
              <p style="text-align: center; font-size: 18px; color: #059669; font-weight: 600; margin: 0 0 20px 0;">Tu solicitud ha sido aprobada</p>
              
              <p>Querido/a <strong>${data.adopterName}</strong>,</p>
              
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10B981; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                <p style="font-size: 18px; margin: 0; color: #065f46; font-weight: bold;">
                  ✅ ¡Tu solicitud para adoptar a ${data.animalName} ha sido APROBADA!
                </p>
              </div>

              <p style="color: #374151;">¡Estamos muy emocionados! Después de revisar cuidadosamente tu solicitud, la fundación ha decidido que eres el hogar perfecto para <strong>${data.animalName}</strong>.</p>

              <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #1f2937;">📋 Información de tu solicitud:</p>
                <ul style="list-style: none; padding: 0; margin: 10px 0;">
                  <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>Animal:</strong> ${data.animalName} 🐕</li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>ID de Solicitud:</strong> #${data.applicationId.slice(-8).toUpperCase()}</li>
                  <li style="padding: 10px 0; color: #374151;"><strong>Estado:</strong> <span style="color: #10B981; font-weight: bold;">APROBADA ✅</span></li>
                </ul>
              </div>

              <p style="margin: 15px 0 10px 0; font-weight: 600; color: #1f2937;">📞 Próximos pasos:</p>
              <ol style="line-height: 1.8; color: #374151; margin: 10px 0; padding-left: 20px; font-size: 15px;">
                <li style="margin: 5px 0;">La fundación se pondrá en contacto contigo para coordinar la entrega</li>
                <li style="margin: 5px 0;">Se firmará un contrato de adopción responsable</li>
                <li style="margin: 5px 0;">Recibirás toda la información médica y cuidados del animal</li>
                <li style="margin: 5px 0;">¡Llevarás a ${data.animalName} a su nuevo hogar! 🏡</li>
              </ol>

              ${
                data.foundationContact
                  ? `
              <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; margin: 20px 0;">
                <p style="margin: 0 0 5px 0; font-weight: 600; color: #3730a3;">📧 Contacto de la fundación:</p>
                <p style="margin: 0; color: #4338ca;">${data.foundationContact}</p>
              </div>
              `
                  : ""
              }

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://huellitasquitenas.vercel.app/mis-solicitudes" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
                  Ver Detalles de mi Adopción
                </a>
              </div>

              <div class="divider"></div>

              <p style="color: #059669; font-weight: bold; text-align: center; font-size: 16px; margin: 15px 0;">
                ¡Gracias por darle una segunda oportunidad a ${data.animalName}! 💚
              </p>
              
              <p style="text-align: center; color: #4b5563; font-size: 13px; margin: 10px 0;">Con mucho cariño,<br><strong style="color: #4F46E5;">El equipo de Huellitas Quiteñas</strong> 🐾</p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0; color: #4b5563;">Este es un correo automático, por favor no responder directamente.</p>
              <p style="margin: 0; color: #374151;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Huellitas Quiteñas</a> © ${new Date().getFullYear()}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Protegiendo y cuidando a nuestros amigos de cuatro patas 🐾
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
¡FELICITACIONES!

Tu solicitud ha sido aprobada

Querido/a ${data.adopterName},

¡Tu solicitud para adoptar a ${data.animalName} ha sido APROBADA!

Información de tu solicitud:
- Animal: ${data.animalName}
- ID de Solicitud: #${data.applicationId.slice(-8).toUpperCase()}
- Estado: APROBADA ✅

Próximos pasos:
1. La fundación se pondrá en contacto contigo para coordinar la entrega
2. Se firmará un contrato de adopción responsable
3. Recibirás toda la información médica y cuidados del animal
4. ¡Llevarás a ${data.animalName} a su nuevo hogar!

${data.foundationContact ? `Contacto de la fundación: ${data.foundationContact}` : ""}

¡Gracias por darle una segunda oportunidad a ${data.animalName}!

Con mucho cariño,
El equipo de Huellitas Quiteñas
    `.trim();

    return this.sendEmail({
      to: data.to,
      subject: `🎉 ¡APROBADA! Tu solicitud de adopción - ${data.animalName}`,
      html,
      text,
    });
  }

  /**
   * Envía notificación de solicitud RECHAZADA
   */
  async sendApplicationRejectedEmail(data: {
    to: string;
    adopterName: string;
    animalName: string;
    applicationId: string;
    reason?: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          ${this.getEmailStyles()}
        </head>
        <body>
          <div class="container">
            ${this.getEmailHeader("linear-gradient(135deg, #F59E0B 0%, #D97706 100%)")}
            
            <div class="content">
              <h2 style="color: #D97706; margin: 0 0 15px 0; font-size: 22px; text-align: center;">📋 Decisión sobre tu solicitud</h2>
              
              <p>Hola <strong>${data.adopterName}</strong>,</p>
              
              <p style="color: #374151;">Gracias por tu interés en adoptar a <strong>${data.animalName}</strong>. Después de revisar cuidadosamente tu solicitud, lamentamos informarte que en esta ocasión <strong>no ha sido aprobada</strong>.</p>

              <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #1f2937;">📋 Información de tu solicitud:</p>
                <ul style="list-style: none; padding: 0; margin: 10px 0;">
                  <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>Animal:</strong> ${data.animalName} 🐕</li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>ID de Solicitud:</strong> #${data.applicationId.slice(-8).toUpperCase()}</li>
                  <li style="padding: 10px 0; color: #374151;"><strong>Estado:</strong> <span style="color: #DC2626; font-weight: bold;">NO APROBADA</span></li>
                </ul>
              </div>

              ${
                data.reason
                  ? `
              <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444; margin: 20px 0;">
                <p style="margin: 0 0 5px 0; font-weight: 600; color: #991b1b;">📝 Razón:</p>
                <p style="margin: 0; color: #b91c1c;">${data.reason}</p>
              </div>
              `
                  : ""
              }

              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0;">
                <p style="margin: 0 0 5px 0; font-weight: 600; color: #1e40af;">💙 No te desanimes</p>
                <p style="margin: 10px 0; color: #1e3a8a;">
                  Esta decisión no significa que no puedas adoptar en el futuro. Te animamos a:
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e3a8a;">
                  <li>Explorar otros animales disponibles</li>
                  <li>Mejorar las condiciones mencionadas (si aplica)</li>
                  <li>Aplicar nuevamente cuando estés listo/a</li>
                  <li>Contactarnos para más orientación</li>
                </ul>
              </div>

              <p style="color: #374151;">Sabemos que esto puede ser decepcionante, pero nuestra prioridad es el bienestar de los animales y encontrar el mejor match para ambas partes.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/catalog" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
                  Ver Otros Animales Disponibles
                </a>
              </div>

              <div class="divider"></div>

              <p style="text-align: center; color: #374151; font-size: 15px;">Apreciamos tu comprensión y tu interés en adopción responsable. ¡No te rindas! Tu compañero perfecto está esperándote. 🐾</p>
              
              <p style="text-align: center; color: #4b5563; font-size: 13px; margin: 10px 0;">Con cariño,<br><strong style="color: #4F46E5;">El equipo de Huellitas Quiteñas</strong> 🐾</p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0; color: #4b5563;">Este es un correo automático, por favor no responder directamente.</p>
              <p style="margin: 0; color: #374151;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Huellitas Quiteñas</a> © ${new Date().getFullYear()}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Protegiendo y cuidando a nuestros amigos de cuatro patas 🐾
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Decisión sobre tu solicitud

Hola ${data.adopterName},

Gracias por tu interés en adoptar a ${data.animalName}. Después de revisar cuidadosamente tu solicitud, lamentamos informarte que en esta ocasión no ha sido aprobada.

Información de tu solicitud:
- Animal: ${data.animalName}
- ID de Solicitud: #${data.applicationId.slice(-8).toUpperCase()}
- Estado: NO APROBADA

${data.reason ? `Razón: ${data.reason}` : ""}

No te desanimes:
- Explora otros animales disponibles
- Mejora las condiciones mencionadas (si aplica)
- Aplica nuevamente cuando estés listo/a
- Contáctanos para más orientación

Apreciamos tu comprensión y tu interés en adopción responsable.

Con cariño,
El equipo de Huellitas Quiteñas
    `.trim();

    return this.sendEmail({
      to: data.to,
      subject: `Decisión sobre tu solicitud de adopción - ${data.animalName}`,
      html,
      text,
    });
  }

  /**
   * Envía notificación de cambio de estado general
   */
  async sendApplicationStatusChangeEmail(data: {
    to: string;
    adopterName: string;
    animalName: string;
    applicationId: string;
    oldStatus: string;
    newStatus: string;
  }): Promise<boolean> {
    const statusLabels: Record<string, string> = {
      RECEIVED: "Recibida",
      IN_REVIEW: "En Revisión",
      HOME_VISIT: "Visita Domiciliaria",
      APPROVED: "Aprobada",
      REJECTED: "Rechazada",
    };

    const statusColors: Record<string, string> = {
      RECEIVED: "#6B7280",
      IN_REVIEW: "#F59E0B",
      HOME_VISIT: "#3B82F6",
      APPROVED: "#10B981",
      REJECTED: "#EF4444",
    };

    const newStatusLabel = statusLabels[data.newStatus] || data.newStatus;
    const newStatusColor = statusColors[data.newStatus] || "#6B7280";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          ${this.getEmailStyles()}
        </head>
        <body>
          <div class="container">
            ${this.getEmailHeader()}
            
            <div class="content">
              <h2 style="color: #4F46E5; margin: 0 0 15px 0; font-size: 22px; text-align: center;">📋 Actualización de tu Solicitud</h2>
              
              <p>Hola <strong>${data.adopterName}</strong>,</p>
              
              <p style="color: #374151;">Te informamos que el estado de tu solicitud de adopción ha sido actualizado.</p>

              <div class="info-box">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #1f2937;">📋 Detalles:</p>
                <ul style="list-style: none; padding: 0; margin: 10px 0;">
                  <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>Animal:</strong> ${data.animalName} 🐕</li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><strong>ID de Solicitud:</strong> #${data.applicationId.slice(-8).toUpperCase()}</li>
                  <li style="padding: 10px 0; color: #374151;"><strong>Nuevo Estado:</strong> <span style="display: inline-block; padding: 8px 16px; background-color: ${newStatusColor}; color: #ffffff; border-radius: 20px; font-weight: bold; font-size: 14px;">${newStatusLabel}</span></li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/mis-solicitudes" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
                  Ver Detalles de mi Solicitud
                </a>
              </div>

              <div class="divider"></div>

              <p style="color: #374151;">Puedes revisar todos los detalles y el progreso de tu solicitud en tu panel de usuario.</p>
              
              <p style="text-align: center; color: #4b5563; font-size: 13px; margin: 10px 0;">Con cariño,<br><strong style="color: #4F46E5;">El equipo de Huellitas Quiteñas</strong> 🐾</p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0; color: #4b5563;">Este es un correo automático, por favor no responder directamente.</p>
              <p style="margin: 0; color: #374151;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Huellitas Quiteñas</a> © ${new Date().getFullYear()}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Protegiendo y cuidando a nuestros amigos de cuatro patas 🐾
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Actualización de tu Solicitud

Hola ${data.adopterName},

Te informamos que el estado de tu solicitud de adopción ha sido actualizado.

Detalles:
- Animal: ${data.animalName}
- ID de Solicitud: #${data.applicationId.slice(-8).toUpperCase()}
- Nuevo Estado: ${newStatusLabel}

Puedes revisar todos los detalles en tu panel de usuario.

Con cariño,
El equipo de Huellitas Quiteñas
    `.trim();

    return this.sendEmail({
      to: data.to,
      subject: `📋 Actualización de solicitud - ${data.animalName}`,
      html,
      text,
    });
  }

  // ========================
  // NOTIFICACIONES PARA FUNDACIÓN
  // ========================

  /**
   * Notifica a la fundación sobre nueva solicitud de adopción
   */
  async sendNewApplicationToFoundation(data: {
    to: string;
    foundationName: string;
    adopterName: string;
    adopterEmail: string;
    animalName: string;
    applicationId: string;
    score: number;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${this.getEmailStyles()}
        </head>
        <body>
          <div class="container">
            ${this.getEmailHeader("linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)")}
            
            <div class="content">
              <h2 style="color: #8B5CF6; margin-top: 0; font-size: 24px; text-align: center;">🔔 ¡Nueva Solicitud de Adopción!</h2>
              
              <p>Hola <strong>${data.foundationName}</strong>,</p>
              
              <p>¡Excelentes noticias! Has recibido una nueva solicitud de adopción en tu fundación.</p>

              <div class="highlight-box">
                <p style="margin-top: 0; color: #1e40af;"><strong>🐕 Detalles de la solicitud:</strong></p>
                <ul style="list-style: none; padding: 0; margin: 15px 0;">
                  <li style="padding: 12px 0; border-bottom: 1px solid #bfdbfe; color: #1e3a8a;">
                    <strong>Animal:</strong> ${data.animalName} 🐕
                  </li>
                  <li style="padding: 12px 0; border-bottom: 1px solid #bfdbfe; color: #1e3a8a;">
                    <strong>Solicitante:</strong> ${data.adopterName}
                  </li>
                  <li style="padding: 12px 0; border-bottom: 1px solid #bfdbfe; color: #1e3a8a;">
                    <strong>Email:</strong> <a href="mailto:${data.adopterEmail}" style="color: #2563eb; text-decoration: underline;">${data.adopterEmail}</a>
                  </li>
                  <li style="padding: 12px 0; border-bottom: 1px solid #bfdbfe; color: #1e3a8a;">
                    <strong>ID de Solicitud:</strong> #${data.applicationId.slice(-8).toUpperCase()}
                  </li>
                  <li style="padding: 12px 0; border-bottom: 1px solid #bfdbfe; color: #1e3a8a;">
                    <strong>Compatibilidad:</strong> <span style="display: inline-block; padding: 8px 16px; background-color: #10b981; color: #ffffff; border-radius: 20px; font-weight: bold; font-size: 16px; text-decoration: none; font-family: Arial, sans-serif;">${data.score}%</span>
                  </li>
                  <li style="padding: 12px 0; color: #1e3a8a;">
                    <strong>Fecha:</strong> ${new Date().toLocaleDateString("es-ES", { dateStyle: "full" })}
                  </li>
                </ul>
              </div>

              <div class="divider"></div>

              <div class="info-box" style="background-color: #fef3c7; border-color: #fbbf24;">
                <p style="margin: 0; color: #78350f;"><strong>⏰ Acción requerida:</strong></p>
                <p style="margin: 10px 0 0 0; color: #92400e;">Por favor, revisa la solicitud lo antes posible y toma una decisión. Recuerda que el tiempo de respuesta afecta la experiencia del adoptante.</p>
              </div>

              <div style="text-align: center; margin: 35px 0;">
                <a href="https://huellitasquitenas.vercel.app/fundacion/solicitudes" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
                  📋 Revisar Solicitud Ahora
                </a>
              </div>

              <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 25px 0;">
                <p style="margin: 0; color: #1e40af; font-weight: 500;"><strong>💡 Tip:</strong> Responde dentro de las próximas 48 horas para mantener una buena experiencia del usuario.</p>
              </div>

              <div class="divider"></div>
              
              <p style="text-align: center; font-size: 16px; color: #1f2937;">¡Gracias por tu dedicación en encontrar hogares amorosos! 💜</p>
              
              <p style="text-align: center; color: #4b5563; font-size: 14px;">Con cariño,<br><strong style="color: #4F46E5;">El equipo de Huellitas Quiteñas</strong> 🐾</p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0; color: #4b5563;">Este es un correo automático, por favor no responder directamente.</p>
              <p style="margin: 0; color: #374151;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Huellitas Quiteñas</a> © ${new Date().getFullYear()}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Protegiendo y cuidando a nuestros amigos de cuatro patas 🐾
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
¡Nueva Solicitud de Adopción!

Hola ${data.foundationName},

¡Excelentes noticias! Has recibido una nueva solicitud de adopción en tu fundación.

Detalles de la solicitud:
- Animal: ${data.animalName}
- Solicitante: ${data.adopterName}
- Email: ${data.adopterEmail}
- ID de Solicitud: #${data.applicationId.slice(-8).toUpperCase()}
- Compatibilidad: ${data.score}%
- Fecha: ${new Date().toLocaleDateString("es-ES", { dateStyle: "full" })}

Por favor, revisa la solicitud lo antes posible y toma una decisión.

¡Gracias por tu dedicación en encontrar hogares amorosos!

Con cariño,
El equipo de Huellitas Quiteñas
    `.trim();

    return this.sendEmail({
      to: data.to,
      subject: `🔔 Nueva solicitud de adopción - ${data.animalName}`,
      html,
      text,
    });
  }

  /**
   * Notifica a la fundación sobre nuevo mensaje de contacto
   */
  async sendContactMessageToFoundation(data: {
    to: string;
    foundationName?: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #3B82F6; display: block; margin-bottom: 5px; }
            .value { padding: 10px; background-color: #f5f5f5; border-left: 3px solid #3B82F6; border-radius: 4px; }
            .message-box { background-color: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 10px; white-space: pre-wrap; }
            .button { display: inline-block; padding: 12px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 48px;">📬</div>
              <h1>Nuevo Mensaje de Contacto</h1>
            </div>
            <div class="content">
              <p>Hola ${data.foundationName ? `<strong>${data.foundationName}</strong>` : ""},</p>
              
              <p>Has recibido un nuevo mensaje de contacto desde tu sitio web:</p>
              
              <div class="field">
                <span class="label">👤 Remitente:</span>
                <div class="value">${data.senderName}</div>
              </div>

              <div class="field">
                <span class="label">📧 Email:</span>
                <div class="value"><a href="mailto:${data.senderEmail}">${data.senderEmail}</a></div>
              </div>

              ${
                data.senderPhone
                  ? `
              <div class="field">
                <span class="label">📱 Teléfono:</span>
                <div class="value"><a href="tel:${data.senderPhone}">${data.senderPhone}</a></div>
              </div>
              `
                  : ""
              }

              <div class="field">
                <span class="label">📋 Asunto:</span>
                <div class="value">${data.subject}</div>
              </div>

              <div class="field">
                <span class="label">💬 Mensaje:</span>
                <div class="message-box">${data.message}</div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://huellitasquitenas.vercel.app/admin/contacto" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif;">
                  Ver en Panel de Administración
                </a>
              </div>

              <p style="color: #666; font-size: 14px; border-left: 4px solid #3B82F6; padding-left: 15px;">
                <strong>💡 Recuerda:</strong> Responde lo antes posible para brindar un excelente servicio.
              </p>
              
              <p>Con cariño,<br><strong>El equipo de Huellitas Quiteñas</strong> 🐾</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no responder directamente.</p>
              <p>Patitas Quiteñas © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Nuevo Mensaje de Contacto

Hola ${data.foundationName || ""},

Has recibido un nuevo mensaje de contacto desde tu sitio web:

Remitente: ${data.senderName}
Email: ${data.senderEmail}
${data.senderPhone ? `Teléfono: ${data.senderPhone}` : ""}
Asunto: ${data.subject}

Mensaje:
${data.message}

Responde lo antes posible para brindar un excelente servicio.

Con cariño,
El equipo de Huellitas Quiteñas
    `.trim();

    return this.sendEmail({
      to: data.to,
      subject: `📬 Nuevo mensaje de contacto: ${data.subject}`,
      html,
      text,
    });
  }

  /**
   * Notifica a la fundación/admin sobre problema técnico
   */
  async sendTechnicalIssueAlert(data: {
    to: string;
    issueType: string;
    description: string;
    userEmail?: string;
    stackTrace?: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background-color: #fef2f2; border-left: 4px solid #EF4444; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .code-box { background-color: #1f2937; color: #f9fafb; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; overflow-x: auto; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="font-size: 48px;">⚠️</div>
              <h1>Alerta de Problema Técnico</h1>
            </div>
            <div class="content">
              <p>Se ha detectado un problema técnico en la plataforma:</p>

              <div class="alert-box">
                <p><strong>🔴 Tipo de problema:</strong> ${data.issueType}</p>
                <p><strong>📝 Descripción:</strong></p>
                <p>${data.description}</p>
                ${data.userEmail ? `<p><strong>👤 Usuario afectado:</strong> ${data.userEmail}</p>` : ""}
                <p><strong>🕒 Fecha/Hora:</strong> ${new Date().toLocaleString("es-ES")}</p>
              </div>

              ${
                data.stackTrace
                  ? `
              <p><strong>🔍 Stack Trace:</strong></p>
              <div class="code-box">${data.stackTrace}</div>
              `
                  : ""
              }

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Por favor, revisa y soluciona este problema lo antes posible para mantener la calidad del servicio.
              </p>
              
              <p>Sistema de Monitoreo<br><strong>Patitas Quiteñas</strong> 🐾</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático generado por el sistema de monitoreo.</p>
              <p>Patitas Quiteñas © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
⚠️ Alerta de Problema Técnico

Se ha detectado un problema técnico en la plataforma:

Tipo de problema: ${data.issueType}
Descripción: ${data.description}
${data.userEmail ? `Usuario afectado: ${data.userEmail}` : ""}
Fecha/Hora: ${new Date().toLocaleString("es-ES")}

${data.stackTrace ? `Stack Trace:\n${data.stackTrace}` : ""}

Por favor, revisa y soluciona este problema lo antes posible.

Sistema de Monitoreo
Patitas Quiteñas
    `.trim();

    return this.sendEmail({
      to: data.to,
      subject: `⚠️ ALERTA: ${data.issueType}`,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
