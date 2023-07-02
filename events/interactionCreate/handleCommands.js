const { MANAGEMENT_DISCORD_ID, GUILD_ID } = require('../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;;

    const localCommands = getLocalCommands();

    try {
        const commandObject = localCommands.find(
          (cmd) => cmd.name === interaction.commandName
        );
    
        if (!commandObject) return;
    
        if (commandObject.managementOnly) {
          if (!MANAGEMENT_DISCORD_ID.includes(interaction.member.id)) {
            interaction.reply({
              content: 'Only developers are allowed to run this command.',
              ephemeral: true,
            });
            return;
          }
        }
    
        if (commandObject.GUILD_ID) {
          if (!(interaction.guild.id === GUILD_ID)) {
            interaction.reply({
              content: 'This command cannot be ran here.',
              ephemeral: true,
            });
            return;
          }
        }
    
        if (commandObject.permissionsRequired?.length) {
          for (const permission of commandObject.permissionsRequired) {
            if (!interaction.member.permissions.has(permission)) {
              interaction.reply({
                content: 'Not enough permissions.',
                ephemeral: true,
              });
              return;
            }
          }
        }
    
        await commandObject.callback(client, interaction);
      } catch (error) {
        console.log(`There was an error running this command: ${error}`);
      }
    };
    