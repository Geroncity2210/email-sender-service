const { connect }       = require('./kafkaClient');
const { startConsumer } = require('./consumer');

async function bootstrap() {
  try {
    await connect();
    await startConsumer();
    console.log('[inventory] Servicio iniciado y en escucha');
  } catch (err) {
    console.error('[inventory] Error fatal al iniciar:', err.message);
    process.exit(1);
  }
}

bootstrap();