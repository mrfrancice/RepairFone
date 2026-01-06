import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from './seeders/seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seederService = app.get(SeederService);

  const args = process.argv.slice(2);

  if (args.includes('--clear')) {
    await seederService.clearAll();
  }

  await seederService.seed();

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
