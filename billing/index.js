const { connect }       = require('./kafkaClient');
const { startConsumer } = require('./consumer');

async function bootstrap() {
  try {
    await connect();
    await startConsumer();
    console.log('[billing] Servicio iniciado y en escucha');
  } catch (err) {
    console.error('[billing] Error fatal al iniciar:', err.message);
    process.exit(1);
  }
}

bootstrap();