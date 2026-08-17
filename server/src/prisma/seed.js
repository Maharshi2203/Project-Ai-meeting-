const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database with demo user and realistic meeting sample...');

  const email = 'demo@example.com';
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log('Demo user already exists.');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await prisma.user.create({
    data: {
      name: 'Demo Architect',
      email: email,
      passwordHash: passwordHash
    }
  });

  const sampleTranscript = `Project kickoff meeting between the client and development team.

The team discusses the MVP scope, technology stack, timeline, authentication, dashboard, reporting and deployment.

The client approves React for the frontend and Node.js for the backend.

The team agrees that the MVP should be ready by September 15.

Rahul will prepare the authentication module by September 5.

Priya will prepare the database schema.

The client will provide the final branding assets by September 3.

There is concern about the reporting requirements because some details are still unclear.

The team agrees to schedule a follow-up discussion about reporting.`;

  const meeting = await prisma.meeting.create({
    data: {
      userId: user.id,
      title: 'Project Kickoff & MVP Planning',
      meetingDate: new Date('2026-08-15'),
      meetingType: 'Project Meeting',
      participants: 'Client, Rahul, Priya, Team Lead',
      transcript: sampleTranscript,
      summary: 'Project kickoff discussion aligning the client and development team on MVP scope, stack (React + Node.js), and core milestone dates.',
      discussionPoints: JSON.stringify([
        'MVP scope alignment across frontend, backend, dashboard, and reporting',
        'Frontend and backend technology stack confirmation',
        'Project timeline and milestone deadlines',
        'Reporting module requirements clarification needed'
      ]),
      decisions: JSON.stringify([
        'Approved React for frontend architecture',
        'Approved Node.js for backend REST APIs',
        'Target MVP completion date set to September 15, 2026',
        'Agreed to hold follow-up meeting specifically for reporting requirements'
      ]),
      risks: JSON.stringify([
        'Reporting requirements details remain unclear and need clarification'
      ]),
      unansweredQuestions: JSON.stringify([
        'What specific metrics and export formats are required for the reporting module?'
      ]),
      actionItems: {
        create: [
          {
            userId: user.id,
            task: 'Rahul will prepare the authentication module',
            owner: 'Rahul',
            dueDate: new Date('2026-09-05'),
            priority: 'High',
            status: 'In Progress'
          },
          {
            userId: user.id,
            task: 'Priya will prepare the database schema',
            owner: 'Priya',
            dueDate: new Date('2026-08-20'),
            priority: 'High',
            status: 'Completed'
          },
          {
            userId: user.id,
            task: 'The client will provide the final branding assets',
            owner: 'Client',
            dueDate: new Date('2026-09-03'),
            priority: 'Medium',
            status: 'Open'
          },
          {
            userId: user.id,
            task: 'Schedule follow-up discussion about reporting details',
            owner: 'Team Lead',
            dueDate: new Date('2026-08-10'), // Overdue for demo purpose
            priority: 'Medium',
            status: 'Open'
          }
        ]
      }
    }
  });

  console.log(`Seeding complete! User created: ${email} / password123. Meeting created ID: ${meeting.id}`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
