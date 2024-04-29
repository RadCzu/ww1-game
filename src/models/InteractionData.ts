
const interactionData = new Map();

function addInteractionData(data: {identifier: string, data: any}) {

  interactionData.set(data.identifier, data.data);
  console.log(interactionData);
}

/**
 * This function can return a {}, an empty object
 * 
 */
function getInteractionData(identifier: string) {
  if(interactionData.get(identifier) !== undefined) {
    return interactionData.get(identifier);
  } else {
    return {};
  }

}

function deleteInteractionData(identifier: string) {
  console.log("deleting");
  interactionData.delete(identifier);
}

export {deleteInteractionData, getInteractionData, addInteractionData}