import { ApplicationCommandOptionType } from "discord.js";

type CommandOption = {
  name: string;
  description: string;
  required?: boolean;
  type: ApplicationCommandOptionType;
  // Add any other properties you expect here
};

type Command = {
  name: string;
  description: string;
  // Add other properties as needed
  options: CommandOption[];
};

export async function areCommandsDifferent(
  existingCommand: Command,
  localCommand: Command
): Promise<boolean> {
  const areChoicesDifferent = (existingChoices: Record<string, any>, localChoices: Record<string, any>) => {
    for (const localChoiceName in localChoices) {
      const existingChoice = existingChoices[localChoiceName];
      
      if (!existingChoice) {
        return true;
      }

      if (localChoices[localChoiceName].value !== existingChoice.value) {
        return true;
      }
    }
    return false;
  };

  const areOptionsDifferent = (existingOptions: Record<string, any>, localOptions: Record<string, any>) => {
    for (const localOptionName in localOptions) {
      const existingOption = existingOptions[localOptionName];

      if (!existingOption) {
        return true;
      }

      if (
        localOptions[localOptionName].description !== existingOption.description ||
        localOptions[localOptionName].type !== existingOption.type ||
        (localOptions[localOptionName].required || false) !== existingOption.required ||
        (localOptions[localOptionName].choices?.length || 0) !==
          (existingOption.choices?.length || 0) ||
        areChoicesDifferent(
          localOptions[localOptionName].choices || {},
          existingOption.choices || {}
        )
      ) {
        return true;
      }
    }
    return false;
  };

  if (
    existingCommand.description !== localCommand.description ||
    Object.keys(existingCommand.options || {}).length !==
      Object.keys(localCommand.options || {}).length ||
    areOptionsDifferent(existingCommand.options || {}, localCommand.options || {})
  ) {
    return true;
  }

  return false;
}