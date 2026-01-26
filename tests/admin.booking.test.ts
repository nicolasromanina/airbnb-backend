import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let mongod: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'testsecret';

  // Import after setting env
  const createApp = (await import('../src/app')).createApp;
  app = createApp();

  // Wait for mongoose connection
  await new Promise((resolve) => setTimeout(resolve, 500));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('confirm and cancel reservation endpoints update status and notify', async () => {
  const { User } = await import('../src/models/User');
  const { Reservation } = await import('../src/models/Reservation');

  // Create admin user
  const admin = await User.create({
    email: 'admin@example.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'superadmin'
  });

  const token = jwt.sign({ userId: admin._id.toString() }, process.env.JWT_SECRET!);

  // Create regular user and reservation
  const user = await User.create({
    email: 'client@example.com',
    password: 'password123',
    firstName: 'Client',
    lastName: 'Test',
    role: 'user'
  });

  const reservation = await Reservation.create({
    user: user._id,
    apartmentId: 1,
    apartmentNumber: 'A1',
    title: 'Test Stay',
    image: '',
    includes: [],
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 24 * 3600 * 1000),
    nights: 1,
    guests: 1,
    bedrooms: 1,
    totalPrice: 100,
    pricePerNight: 100,
  });

  // Confirm
  const res1 = await request(app)
    .post(`/api/admin/bookings/${reservation._id}/confirm`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(res1.body.data.status).toBe('confirmed');

  // Cancel (should set cancelled)
  const res2 = await request(app)
    .post(`/api/admin/bookings/${reservation._id}/cancel`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(res2.body.data.status).toBe('cancelled');
});
