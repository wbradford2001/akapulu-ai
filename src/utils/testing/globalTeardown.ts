import { getLatestRunStats } from './modelPricingInterface';

export default async function globalTeardown() {
  await getLatestRunStats();
}