exports.up = async function(knex) {
  // Check if transactions table exists
  const hasTable = await knex.schema.hasTable('transactions');
  if (!hasTable) {
    console.warn('⚠️  [Migration] transactions table does not exist. Skipping payment fields addition.');
    return;
  }
  
  // Check if columns already exist (check first column as indicator)
  const hasPaymentMethod = await knex.schema.hasColumn('transactions', 'payment_method');
  if (hasPaymentMethod) {
    console.log('✅ [Migration] Payment fields already exist in transactions table.');
    return;
  }
  
  return knex.schema.alterTable('transactions', table => {
    table.string('payment_method').defaultTo('card');
    table.json('payment_details').nullable();
    table.enum('status', ['pending', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.string('currency', 3).defaultTo('EGP');
    table.string('reference_id').nullable();
    table.timestamp('completed_at').nullable();
  });
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('transactions');
  if (!hasTable) {
    return; // Table doesn't exist, nothing to rollback
  }
  
  const hasPaymentMethod = await knex.schema.hasColumn('transactions', 'payment_method');
  if (!hasPaymentMethod) {
    return; // Columns don't exist, nothing to rollback
  }
  
  return knex.schema.alterTable('transactions', table => {
    table.dropColumn('payment_method');
    table.dropColumn('payment_details');
    table.dropColumn('status');
    table.dropColumn('currency');
    table.dropColumn('reference_id');
    table.dropColumn('completed_at');
  });
};

