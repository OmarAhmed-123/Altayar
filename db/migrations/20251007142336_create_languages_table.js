exports.up = function(knex) {
  return knex.schema.createTable('languages', table => {
    table.increments('id').primary();
    table.string('code').unique().notNullable(); // en, ar, fr, etc.
    table.string('name').notNullable(); // English, Arabic, French
    table.string('native_name').notNullable(); // English, العربية, Français
    table.string('flag_emoji'); // 🇺🇸, 🇸🇦, 🇫🇷
    table.boolean('is_rtl').defaultTo(false); // Right-to-left languages
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_default').defaultTo(false);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
    
    table.index(['is_active', 'sort_order']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('languages');
};