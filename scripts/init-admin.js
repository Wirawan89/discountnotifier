const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing admin setup...');

  // Create default API configurations
  const apiConfigs = [
    {
      provider: 'openrouter',
      isEnabled: true,
      apiKey: process.env.OPENROUTER_API_KEY || '',
      modelName: 'perplexity/sonar',
      maxTokens: 3000,
      temperature: 0.7,
      priority: 1
    },
    {
      provider: 'gemini',
      isEnabled: true,
      apiKey: process.env.GEMINI_API_KEY || '',
      modelName: 'gemini-1.5-pro',
      maxTokens: 3000,
      temperature: 0.7,
      priority: 2
    },
    {
      provider: 'claude',
      isEnabled: true,
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      modelName: 'claude-3-5-sonnet-20241022',
      maxTokens: 3000,
      temperature: 0.7,
      priority: 3
    }
  ];

  for (const config of apiConfigs) {
    try {
      await prisma.apiConfiguration.upsert({
        where: { provider: config.provider },
        update: config,
        create: config
      });
      console.log(`✅ API configuration for ${config.provider} created/updated`);
    } catch (error) {
      console.error(`❌ Error creating API configuration for ${config.provider}:`, error);
    }
  }

  // Create admin user if it doesn't exist
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@discountnotifier.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin User',
          suburb: 'Sydney',
          role: 'admin',
          preferences: {
            create: {
              emailNotifications: true,
              pushNotifications: true,
              notificationFrequency: 'daily'
            }
          }
        }
      });

      console.log(`✅ Admin user created: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('   Please change the password after first login!');
    } else {
      // Update existing user to admin role
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'admin' }
      });
      console.log(`✅ Existing user ${adminEmail} updated to admin role`);
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }

  console.log('\n🎉 Admin setup completed!');
  console.log('You can now access the admin dashboard at /admin');
}

main()
  .catch((e) => {
    console.error('❌ Error during admin setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






