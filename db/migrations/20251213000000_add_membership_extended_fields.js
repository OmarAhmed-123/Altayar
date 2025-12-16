/**
 * Migration: Add extended fields to memberships table
 * Adds: point_multiplier, cashback_rate, welcome_points, welcome_cashback, duration_days, description
 */

exports.up = async function(knex) {
  // Check if columns already exist before adding
  const hasPointMultiplier = await knex.schema.hasColumn('memberships', 'point_multiplier');
  const hasCashbackRate = await knex.schema.hasColumn('memberships', 'cashback_rate');
  const hasWelcomePoints = await knex.schema.hasColumn('memberships', 'welcome_points');
  const hasWelcomeCashback = await knex.schema.hasColumn('memberships', 'welcome_cashback');
  const hasDurationDays = await knex.schema.hasColumn('memberships', 'duration_days');
  const hasDescription = await knex.schema.hasColumn('memberships', 'description');

  await knex.schema.table('memberships', function(table) {
    if (!hasPointMultiplier) {
      table.decimal('point_multiplier', 5, 2).defaultTo(1.0).after('points');
    }
    if (!hasCashbackRate) {
      table.decimal('cashback_rate', 5, 2).defaultTo(0.0).after('point_multiplier');
    }
    if (!hasWelcomePoints) {
      table.integer('welcome_points').defaultTo(0).after('cashback_rate');
    }
    if (!hasWelcomeCashback) {
      table.decimal('welcome_cashback', 10, 2).defaultTo(0.0).after('welcome_points');
    }
    if (!hasDurationDays) {
      table.integer('duration_days').defaultTo(365).after('welcome_cashback');
    }
    if (!hasDescription) {
      table.text('description').nullable().after('benefits');
    }
  });
};

exports.down = async function(knex) {
  await knex.schema.table('memberships', function(table) {
    table.dropColumn('point_multiplier');
    table.dropColumn('cashback_rate');
    table.dropColumn('welcome_points');
    table.dropColumn('welcome_cashback');
    table.dropColumn('duration_days');
    table.dropColumn('description');
  });
};

