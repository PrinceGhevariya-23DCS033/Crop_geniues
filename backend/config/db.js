

import mongoose from 'mongoose';

const isTrue = (v) => String(v).toLowerCase() === 'true';

const connectWithUri = async (uri, label) => {
  const conn = await mongoose.connect(uri, {});
  console.log(`✅ MongoDB connected (${label}): ${conn.connection.host}`);
  return conn;
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;
  const allowNoDb = isTrue(process.env.MONGO_OPTIONAL);

  if (!primaryUri) {
    const msg = 'MONGODB_URI is missing in environment';
    if (allowNoDb) {
      console.warn(`⚠️ ${msg}. Continuing with database-disabled mode (MONGO_OPTIONAL=true).`);
      return;
    }
    throw new Error(msg);
  }

  try {
    await connectWithUri(primaryUri, 'primary');
  } catch (error) {
    const isSrvDnsError =
      primaryUri.startsWith('mongodb+srv://') &&
      (String(error?.code) === 'ENOTFOUND' || String(error?.message || '').includes('querySrv ENOTFOUND'));

    if (isSrvDnsError && fallbackUri) {
      try {
        await connectWithUri(fallbackUri, 'fallback');
        return;
      } catch (fallbackError) {
        console.error('❌ MongoDB fallback connection error:', fallbackError.message);
      }
    }

    console.error('❌ MongoDB connection error:', error.message);
    if (allowNoDb) {
      console.warn('⚠️ Continuing with database-disabled mode (MONGO_OPTIONAL=true). Auth/history/notifications will not work.');
      return;
    }
    process.exit(1);
  }
};

export default connectDB;
