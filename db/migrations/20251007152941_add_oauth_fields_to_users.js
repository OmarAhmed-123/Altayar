exports.up = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.boolean('is_oauth_user').defaultTo(false);
    table.string('oauth_provider'); // 'google', 'apple', etc.
    table.string('oauth_id'); // ID from OAuth provider
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.string('avatar_url');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', table => {
    table.dropColumn('is_oauth_user');
    table.dropColumn('oauth_provider');
    table.dropColumn('oauth_id');
    table.dropColumn('email_verified');
    table.dropColumn('email_verified_at');
    table.dropColumn('avatar_url');
  });
};