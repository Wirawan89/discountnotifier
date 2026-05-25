import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email transporter configuration
const createTransporter = () => {
  // For development, you can use Gmail or other SMTP services
  // For production, consider using services like SendGrid, Resend, or AWS SES
  
  // Gmail configuration (for development)
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // Use app password for Gmail
      },
    });
  }
  
  // SendGrid configuration (recommended for production)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }
  
  // Resend configuration
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }
  
  // Default to Gmail with environment variables
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password',
    },
  });
};

// Email templates
const createDiscountNotificationEmail = (
  userName: string,
  categoryName: string,
  discounts: Array<{
    storeName: string;
    title: string;
    description?: string;
    percentage?: number;
    coupon?: string;
    endDate: Date;
  }>
) => {
  const discountList = discounts
    .map(
      (discount) => `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">${discount.title}</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Store:</strong> ${discount.storeName}</p>
          ${discount.description ? `<p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">${discount.description}</p>` : ''}
          ${discount.percentage ? `<p style="margin: 0 0 8px 0; color: #059669; font-size: 14px;"><strong>Discount:</strong> ${discount.percentage}% off</p>` : ''}
          ${discount.coupon ? `<p style="margin: 0 0 8px 0; color: #dc2626; font-size: 14px;"><strong>Coupon:</strong> ${discount.coupon}</p>` : ''}
          <p style="margin: 0; color: #6b7280; font-size: 12px;"><strong>Ends:</strong> ${discount.endDate.toLocaleDateString()}</p>
        </div>
      `
    )
    .join('');

  return {
    subject: `🎉 New Discounts Found in ${categoryName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Discounts Found</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 24px;">🛍️ DiscountNotifier</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Your personal discount finder</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${userName}!</h2>
            
            <p style="color: #374151; margin-bottom: 20px;">
              We found <strong>${discounts.length} new discount${discounts.length > 1 ? 's' : ''}</strong> in the <strong>${categoryName}</strong> category that might interest you!
            </p>
            
            <div style="margin-bottom: 30px;">
              ${discountList}
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
                Want to see more discounts or update your preferences?
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Visit DiscountNotifier
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px;">
                You're receiving this email because you have email notifications enabled for the ${categoryName} category.
                <br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" style="color: #6b7280;">Manage your preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

// Main function to send discount notifications
export async function sendDiscountNotifications(
  categoryId: number,
  newDiscounts: Array<{
    id: number;
    storeId: number;
    title: string;
    description?: string;
    percentage?: number;
    coupon?: string;
    endDate: Date;
  }>
) {
  try {
    // Get category name
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      console.error(`Category with ID ${categoryId} not found`);
      return;
    }

    // Get all users who have this category in their favorites and have email notifications enabled
    const users = await prisma.user.findMany({
      where: {
        preferences: {
          emailNotifications: true,
          favoriteCategories: {
            has: categoryId,
          },
        },
      },
      include: {
        preferences: true,
      },
    });

    if (users.length === 0) {
      console.log(`No users found for category ${category.name}`);
      return;
    }

    // Get store information for the discounts
    const storeIds = [...new Set(newDiscounts.map((d) => d.storeId))];
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    });

    const storeMap = new Map(stores.map((s) => [s.id, s.name]));

    // Prepare discount data for email
    const discountData = newDiscounts.map((discount) => ({
      storeName: storeMap.get(discount.storeId) || 'Unknown Store',
      title: discount.title,
      description: discount.description,
      percentage: discount.percentage,
      coupon: discount.coupon,
      endDate: discount.endDate,
    }));

    // Send emails to each user
    const transporter = createTransporter();
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const { subject, html } = createDiscountNotificationEmail(
          user.name || user.email.split('@')[0],
          category.name,
          discountData
        );

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@discountnotifier.com',
          to: user.email,
          subject,
          html,
        });

        // Create in-app notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `New ${category.name} Discounts`,
            message: `Found ${newDiscounts.length} new discount${newDiscounts.length > 1 ? 's' : ''} in ${category.name}`,
            type: 'discount',
            data: {
              categoryId,
              discountCount: newDiscounts.length,
              categoryName: category.name,
            },
          },
        });

        successCount++;
        console.log(`Email sent successfully to ${user.email}`);
      } catch (error) {
        errorCount++;
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    }

    console.log(`Email notification summary: ${successCount} sent, ${errorCount} failed`);
    return { successCount, errorCount };
  } catch (error) {
    console.error('Error sending discount notifications:', error);
    throw error;
  }
}

// Function to send welcome email
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  try {
    const transporter = createTransporter();
    
    const { subject, html } = {
      subject: '🎉 Welcome to DiscountNotifier!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DiscountNotifier</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #059669; margin: 0; font-size: 28px;">🛍️ Welcome to DiscountNotifier!</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0;">Your personal discount finder</p>
              </div>
              
              <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${userName}!</h2>
              
              <p style="color: #374151; margin-bottom: 20px;">
                Welcome to DiscountNotifier! We're excited to help you discover the best deals and discounts in your area.
              </p>
              
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #0c4a6e; margin: 0 0 15px 0;">🚀 Getting Started</h3>
                <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
                  <li>Browse categories to find stores you love</li>
                  <li>Add your favorite categories to get personalized notifications</li>
                  <li>Set your location for local deals</li>
                  <li>Enable email notifications to never miss a deal</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" 
                   style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Start Exploring Discounts
                </a>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p style="color: #9ca3af; font-size: 12px;">
                  Questions? Contact us at support@discountnotifier.com
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@discountnotifier.com',
      to: userEmail,
      subject,
      html,
    });

    console.log(`Welcome email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${userEmail}:`, error);
  }
}

// Function to send password reset email
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetUrl: string
) {
  try {
    const transporter = createTransporter();

    const subject = 'Reset your DiscountNotifier password';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 26px;">DiscountNotifier</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Password reset request</p>
            </div>

            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${userName},</h2>

            <p style="color: #374151; margin-bottom: 20px;">
              We received a request to reset your DiscountNotifier password. Use the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
              This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
            </p>

            <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">
              If the button does not work, paste this link into your browser:<br>
              ${resetUrl}
            </p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@discountnotifier.com',
      to: userEmail,
      subject,
      html,
    });

    console.log(`Password reset email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send password reset email to ${userEmail}:`, error);
    throw error;
  }
}
