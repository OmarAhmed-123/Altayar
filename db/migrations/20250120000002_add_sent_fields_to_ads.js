/**
 * Migration: Add sent_at and sent_count fields to ads table
 * This tracks when ads were sent and how many users received them
 */

exports.up = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.timestamp('sent_at').nullable();
    table.integer('sent_count').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ads', function(table) {
    table.dropColumn('sent_at');
    table.dropColumn('sent_count');
  });
};

