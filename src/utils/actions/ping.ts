import AllianceModel, { AllianceType } from "../../models/Alliance";

export async function ping(args: any[]): Promise<void> {
  try {
  const name = args[0] as string;

  console.log(`pinged by: ${name}`);
  } catch (error) {
    console.error(`Invalid parameters ${error}`);
  }
}