async function wasProcessed(conn, consumerName, eventId) {
  const [rows] = await conn.query(
    'SELECT event_id FROM processed_events WHERE consumer_name = ? AND event_id = ?',
    [consumerName, eventId]
  );
  return rows.length > 0;
}

async function markProcessed(conn, consumerName, eventId) {
  await conn.query(
    'INSERT INTO processed_events (consumer_name, event_id) VALUES (?, ?)',
    [consumerName, eventId]
  );
}

module.exports = { wasProcessed, markProcessed };