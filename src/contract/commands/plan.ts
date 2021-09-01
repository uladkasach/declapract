import { Command, flags } from '@oclif/command';
import { plan } from '../../logic/commands/plan';

export default class Plan extends Command {
  public static description =
    'plan and display what actions need to be taken in order to make a software project adhere to its declared practices.';
  public static flags = {
    help: flags.help({ char: 'h' }),
    config: flags.string({
      char: 'c',
      description: 'path to the declapract usage config yml',
      required: true,
      default: 'declapract.use.yml',
    }),
    practice: flags.string({
      char: 'p',
      description: 'the name of a specific practice you want to scope checking for',
    }),
  };

  public async run() {
    const { flags } = this.parse(Plan);
    const config = flags.config!;

    // generate the code
    const configPath = config.slice(0, 1) === '/' ? config : `${process.cwd()}/${config}`; // if starts with /, consider it as an absolute path
    await plan({
      usePracticesConfigPath: configPath,
      filter: flags.practice ? { practiceNames: [flags.practice] } : undefined,
    });
  }
}
