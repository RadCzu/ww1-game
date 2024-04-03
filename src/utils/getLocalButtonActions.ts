import path = require("path");
import { getAllFiles } from "../utils/getAllFiles";
import ButtonAction from "../models/ButtonAction";

export async function getLocalButtonActions(): Promise<ButtonAction[]> {
  let localCommands: ButtonAction[] = [];

  const actionCategories = getAllFiles(
    path.join(__dirname, "..", "buttonactions"),
    true
  );

  for(const actionCategory of actionCategories) {
    const actionfiles = getAllFiles(actionCategory);
    for(const actionFile of actionfiles) {

      const actionModule = await import(actionFile);
      
      if (isValidButtonAction(actionModule.default)) {
        localCommands.push(actionModule.default);
      } else {
        console.error(`Invalid button action in file: ${actionFile}`);
      }
    }
  }

  return localCommands;
}

// Function to check if an object conforms to the IButtonAction interface
function isValidButtonAction(object: any): object is ButtonAction {
  return (
    typeof object === 'object' &&
    'execute' in object &&
    typeof object.execute === 'function'
  );
}