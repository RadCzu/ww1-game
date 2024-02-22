import AllianceModel, { AllianceType } from "../../models/Alliance";

export async function ping(args: any[]): Promise<void> {
  try {
  const name = args[0] as string;

  const a: AllianceType = {
    name: "test",
    guildId: "test",
    roleId: "test",
    memberNationIds: ["test"],
  }

  await AllianceModel.create(a);
  

  console.log(`pinged by: ${name}`);
  } catch (error) {
    console.error(`Invalid parameters ${error}`);
  }
}