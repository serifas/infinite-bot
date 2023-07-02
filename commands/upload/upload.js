const {
  MessageEmbed,
  ChannelType,
  client,
  Collection,
  ApplicationCommandOptionType,
  permissionFlagsBits,
} = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const wait = require("node:timers/promises").setTimeout;
const path = require("path");

module.exports = {
  name: "upload",
  description: "Upload a file to Repulsion Servers",
  managementOnly: true,
  // deleted: true,
  options: [
    {
      name: "server-type",
      description: "Vanilla, Modded or ALL",
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "Vanilla",
          value: "vanilla",
        },
        {
          name: "Modded",
          value: "modded",
        },
        {
          name: "All",
          value: "all",
        },
      ],
      required: true,
    },
    {
      name: "directory",
      description: "type the directory",
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "Oxide Plugins",
          value: "/oxide/plugins",
        },
        {
          name: "Oxide Config",
          value: "/oxide/config",
        },
        {
          name: "Oxide Data",
          value: "/oxide/data",
        },
        {
          name: "Oxide Lang",
          value: "/oxide/lang/en",
        },
        {
          name: "Harmony Mods",
          value: "/HarmonyMods",
        },
      ],
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    const servertype = interaction.options.get("server-type").value;
    const directory = interaction.options.get("directory").value;

    console.log(`Attempting to upload file to ${directory} on ${servertype}`);

    // Replying with an embed to the initial interaction
    const creatingEmbed = {
      title: "Creating Upload!",
      description: `>>> Preparing an upload to **${directory}** on **${servertype}** servers!`,
      color: parseInt("FF0000", 16),
    };

    interaction.reply({ embeds: [creatingEmbed] });

    //wait 3 seconds to ask for file to upload
    await wait(3000);

    const channelId = interaction.channelId;
    const channel = await interaction.client.channels.fetch(channelId);

    //create and send uploadFileEmbed embed
    if (channel.type === ChannelType.GuildText) {
      const uploadFileEmbed = {
        title: "Please Upload!",
        description: ">>> Please upload a file within 30 seconds.",
        color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
      };

      channel.send({ embeds: [uploadFileEmbed] });
    }

    // Assuming 'interaction' is the interaction object received from Discord API

    // Function to check if the message has an attachment
    function hasAttachment(message) {
      return message.attachments.size > 0;
    }

    // Get the absolute path to the root directory of the application
    const rootPath = path.resolve();

    // Get the current date in the format YYYY-MM-DD
    function getCurrentDate() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Await messages from the user who initiated the interaction
    interaction.channel
      .awaitMessages({
        filter: (message) =>
          message.author.id === interaction.user.id && hasAttachment(message),
        max: 1,
        time: 30000, // Timeout duration in milliseconds (30 seconds)
        errors: ["time"],
      })

      .then((collected) => {
        const attachment = collected.first().attachments.first();
        const fileURL = attachment.url;

        const currentDate = getCurrentDate();
        const uploadsFolderPath = path.join(rootPath, "uploads", currentDate);
        const filePath = path.join(uploadsFolderPath, attachment.name);

        // Check if the folder exists, create it if necessary
        if (!fs.existsSync(uploadsFolderPath)) {
          fs.mkdirSync(uploadsFolderPath, { recursive: true });
        }

        // Download the file
        axios
          .get(fileURL, { responseType: "stream" })
          .then((response) => {
            // Save the file to the uploads folder
            const fileStream = fs.createWriteStream(filePath);
            response.data.pipe(fileStream);

            fileStream.on("finish", async () => {
              fileStream.close();

              if (channel.type === ChannelType.GuildText) {
                const successDownloadingEmbed = {
                  title: "File Downloaded!",
                  description: `>>> File downloaded and saved as "${attachment.name}".`,
                  color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
                };
                await wait(3000);
                channel.send({ embeds: [successDownloadingEmbed] });
              }

              if (channel.type === ChannelType.GuildText) {
                const startingUploadEmbed = {
                  title: "Starting Upload!",
                  description: `>>> Connecting to each server and uploading **"${attachment.name}"** to **${directory}**.`,
                  color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
                };
                await wait(3000);
                channel.send({ embeds: [startingUploadEmbed] });
              }

              // -------------------------------------------------------------------------------
              const FTPClient = require("ssh2-sftp-client");

              // Load the config file
              const configPath = path.join(__dirname, "../../servers.json");
              const serverConfig = JSON.parse(
                fs.readFileSync(configPath, "utf8")
              );

              // Upload function
              const sftp = new FTPClient();

              try {
                // Connect to each server and upload the file
                for (const server of serverConfig.servers) {
                  const serverType = server.serverType.toLowerCase();

                  // Check if the server type matches the desired type(s)
                  if (
                    serverType === "all" ||
                    serverType === "vanilla" ||
                    serverType === "modded"
                  ) {
                    if (servertype != serverType && servertype != "all") continue;
                    console.log(
                      `Connecting to ${server.host} - ${server.note}...`
                    );

                    const connectionOptions = {
                      host: server.host,
                      port: server.port || 22,
                      username: server.username,
                    };

                    if (server.authentication.type === "key") {
                      connectionOptions.privateKey = fs.readFileSync(
                        path.join(__dirname, server.authentication.keyPath)
                      );
                      connectionOptions.passphrase =
                        server.authentication.passphrase || "";
                    } else if (server.authentication.type === "password") {
                      connectionOptions.password =
                        server.authentication.password;
                    }

                    await sftp.connect(connectionOptions);

                    console.log(
                      `Uploading file to ${server.host} - ${server.note}...`
                    );
                    const remotePath = path.join(directory, attachment.name);
                    await sftp.put(filePath, remotePath.replace(/\\/g, "/"));

                    console.log(
                      `File uploaded to ${server.host} - ${server.note}`
                    );
                    await sftp.end();
                  }
                }

                if (channel.type === ChannelType.GuildText) {
                  const sftpSuccessEmbed = {
                    title: "Successful Upload!",
                    description: `>>> Sucessfully connected to each server and uploaded the file.`,
                    color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
                  };
                  await wait(3000);
                  channel.send({ embeds: [sftpSuccessEmbed] });
                }

              } catch (err) {
                console.error(err);

                if (channel.type === ChannelType.GuildText) {
                  const sftpFailEmbed = {
                    title: "Error Occured!",
                    description: `>>> An error occurred while uploading. Please check console or contact developer!`,
                    color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
                  };
                  await wait(3000);
                  channel.send({ embeds: [sftpFailEmbed] });
                }
              } finally {
                sftp.end();
              }

              // -------------------------------------------------------------------------------

              //End of Upload Success Code
            });

            fileStream.on("error", async (error) => {
              console.error(error);

              if (channel.type === ChannelType.GuildText) {
                const unSuccessDownloadingEmbed = {
                  title: "Error Occured!",
                  description: `>>> An error occurred while uploading. Please check console or contact developer!`,
                  color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
                };
                await wait(3000);
                channel.send({ embeds: [unSuccessDownloadingEmbed] });
              }
            });
          })
          .catch(async (error) => {
            console.error(error);

            if (channel.type === ChannelType.GuildText) {
              const unSuccessDownloadingEmbed = {
                title: "Error Occured!",
                description: `>>> An error occurred while uploading. Please check console or contact developer!`,
                color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
              };
              await wait(3000);
              channel.send({ embeds: [unSuccessDownloadingEmbed] });
            }
          });
      })
    
      .catch(async (error) => {
        if (error instanceof Collection) {
          if (channel.type === ChannelType.GuildText) {
            const noFileEmbed = {
              title: "No File Uploaded!",
              description:
                ">>> You did **not** upload a file within 30 seconds. **Session Closed!**",
              color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
            };
            await wait(3000);
            channel.send({ embeds: [noFileEmbed] });
          }
        } else {
          // Handle other errors
          console.error(error);

          if (channel.type === ChannelType.GuildText) {
            const fileDetectedEmbed = {
              title: "Unknown Error!",
              description: `>>> An error occurred with your file upload. Please check console or contact developer!`,
              color: parseInt("FF0000", 16), // Convert hexadecimal color to integer
            };
            await wait(3000);
            channel.send({ embeds: [fileDetectedEmbed] });
          }
        }
      });
  },
};
