import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const countries = ['England', 'Spain', 'Germany', 'Italy', 'France', 'Portugal', 'Netherlands', 'Belgium'];

async function generateFakeData() {
  console.log('Starting to generate fake data...');

  // Generate teams
  const teams = [];
  for (let i = 0; i < 100000; i++) {
    const team = {
      name: faker.company.name(),
      abbreviation: faker.string.alpha({ length: 3, casing: 'upper' }),
      coach_name: faker.person.fullName(),
      home_stadium: faker.company.name() + ' Stadium',
      founded_year: faker.number.int({ min: 1800, max: 2020 }),
      wins: faker.number.int({ min: 0, max: 100 }),
      draws: faker.number.int({ min: 0, max: 50 }),
      losses: faker.number.int({ min: 0, max: 100 }),
      goals_scored: faker.number.int({ min: 0, max: 200 }),
      goals_conceded: faker.number.int({ min: 0, max: 200 }),
      country: faker.helpers.arrayElement(countries),
      userId: 1,
    };
    teams.push(team);
  }

  console.log('Generated teams, starting to insert into database...');

  // Insert teams in batches
  const batchSize = 1000;
  for (let i = 0; i < teams.length; i += batchSize) {
    const batch = teams.slice(i, i + batchSize);
    await prisma.team.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Inserted teams ${i + 1} to ${Math.min(i + batchSize, teams.length)}`);
  }

  // Generate players
  const players = [];
  const teamsInDb = await prisma.team.findMany({
    select: { id: true },
  });

  for (let i = 0; i < 100000; i++) {
    const player = {
      name: faker.person.fullName(),
      position: faker.helpers.arrayElement(positions),
      age: faker.number.int({ min: 16, max: 40 }),
      nationality: faker.helpers.arrayElement(countries),
      team_id: (faker.helpers.arrayElement(teamsInDb) as { id: number }).id,
    };
    players.push(player);
  }

  console.log('Generated players, starting to insert into database...');

  // Insert players in batches
  for (let i = 0; i < players.length; i += batchSize) {
    const batch = players.slice(i, i + batchSize);
    await prisma.player.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Inserted players ${i + 1} to ${Math.min(i + batchSize, players.length)}`);
  }

  console.log('Finished generating fake data!');
}

generateFakeData()
  .catch((e) => {
    console.error('Error generating fake data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });