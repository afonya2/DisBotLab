import type { Database } from "sqlite3";
import utils, { type Command } from "./utils";
import type { Client } from "discord.js";

export default function (db: Database, config: any, client: Client, getVar: (name: string) => any, setVar: (name: string, value: any) => void) {

}