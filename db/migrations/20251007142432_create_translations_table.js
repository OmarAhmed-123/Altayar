exports.up = function(knex) {
  return knex.schema.createTable('translations', table => {
    table.increments('id').primary();
    table.string('key').notNullable(); // e.g., 'welcome_message', 'button_text_book_now'
    table.integer('language_id').unsigned().notNullable().references('id').inTable('languages').onDelete('CASCADE');
    table.text('value').notNullable();
    table.timestamps(true, true);
    table.unique(['key', 'language_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('translations');
};