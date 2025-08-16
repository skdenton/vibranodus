import click
from sys import exit

from assistant import DriverMigrationAssistant
from utils import Color as color, parse_path


intro = '''
This is the migration assistant for Neo4j language libraries (drivers). It scans your codebase and raises issues you should address before upgrading to a more recent version.
It doesn't automatically rewrite your code; it only points at where action is needed, providing in-context information on how each hit should be addressed.
'''
welcome_warning = intro + '''
Points of care:
- The assistant can detect almost all the changes you need to do in your code, but a few changelog entries can't be surfaced in this form. For a thorough list of changes, see https://neo4j.com/docs/{language_name}-manual/current/migration/ .
- Some of the hits may be false positives, so evaluate each hit.
- Implicit function calls and other hard-to-parse expressions aren't be surfaced by the default parser. To broaden the search radius, use the regex parser (--regex-parser).
- Your Cypher queries may also need changing, but this tool doesn't analyze them. See https://neo4j.com/docs/cypher-manual/current/deprecations-additions-removals-compatibility/ .
'''


@click.command(help=intro + '\nPATH is the location of project to migrate. Supports globbing.')
@click.help_option('--help', '-h')
@click.argument('path', nargs=-1)
@click.option(
    '--language', '-l', 'language_name', required=True,
    type=click.Choice(['python', 'go', 'javascript', 'java', 'dotnet']),
    help='What language the project to migrate is in.'
)
@click.option(
    '--context-lines', '-c', 'context_lines', default=3, show_default=True,
    help='Number of surrounding lines to show around each hit, both before and after.'
)
@click.option(
    '--version', default='6.0', show_default=True,
    help='What version of the library to test compatibility against.'
)
@click.option(
    '--accept-warning', 'accept_warning', is_flag=True, flag_value=True,
    help='Accept and skip the opening warning.'
)
@click.option(
    '--no-output-colors', 'no_output_colors', is_flag=True, flag_value=True,
    help="Don't enrich output with colors."
)
@click.option(
    '--regex-parser', '-R', 'regex_parser', is_flag=True, flag_value=True,
    help='Use the regex parser (likely to surface more matches, although with a higher rate of false positives).'
)
@click.option(
    '--no-interactive', 'no_interactive', is_flag=True, flag_value=True,
    help='Run the tool without pause after each entry.'
)
@click.option(
    '--show-ignored', 'show_ignored', is_flag=True, flag_value=True,
    help='Include ignored entries in output.'
)
def assist(path, language_name, context_lines, version, accept_warning, no_output_colors, regex_parser, no_interactive, show_ignored):
    assistant = DriverMigrationAssistant(language_name, context_lines, version, no_output_colors, regex_parser)
    warn_user(accept_warning, language_name)
    file_paths = parse_path(path)
    assistant.print_msg('-'*50)
    assistant.print_msg('\n' + click.style('Files to process: ', bold=True) + str(len(file_paths)) + '\n')
    assistant.print_msg('-'*50 + '\n')

    deprecated_count = 0; removed_count = 0;
    for file_path in file_paths:
        assistant.print_msg(click.style(f'File: {file_path}\n', fg=color.file, bold=True))
        messages = assistant.process_file(file_path)
        for i in range(len(messages)):
            msg = messages[i]

            if not show_ignored and assistant.is_ignored_msg(msg):
                assistant.print_msg(click.style(
                    f'({i+1}/{len(messages)}) ' + 'Ignored\n',
                    fg='blue', bold=True))
                continue

            assistant.print_msg(click.style(
                f'({i+1}/{len(messages)}) {msg["content"]}',
                fg='blue', bold=True))

            if not no_interactive:
                choice = click.prompt(
                    click.style(
                        'What to do? [(n) Next, (i) Add to ignore list and hide]',
                        fg='blue', bold=True
                    ), type=click.Choice(['n', 'i']), show_choices=False)
                if choice == 'i':
                    assistant.set_ignore_msg(msg)
                assistant.print_msg('')  # newline

        deprecated_count += assistant.source.deprecated_count
        removed_count += assistant.source.removed_count

        assistant.print_msg(
            click.style('\nDeprecations in file: ', bold=True) +
            click.style(assistant.source.deprecated_count, fg=color.deprecated))
        assistant.print_msg(
            click.style('Removals in file: ', bold=True) +
            click.style(assistant.source.removed_count, fg=color.removed) + '\n')

        assistant.print_msg('-'*50)

    assistant.print_msg(click.style('\nTotal deprecations: ', bold=True) + click.style(deprecated_count, fg=color.deprecated))
    assistant.print_msg(click.style('Total removals: ', bold=True) + click.style(removed_count, fg=color.removed))

    assistant.print_msg(click.style('\nLibrary full manual: ', bold=True) + f'https://neo4j.com/docs/{language_name}-manual/current/')
    assistant.print_msg(click.style('Migration guide: ', bold=True) + f'https://neo4j.com/docs/{language_name}-manual/current/migration/' + '\n')


def warn_user(accept_warning, language_name):
    if not accept_warning:
        print(welcome_warning.format(language_name=language_name))
        agree = click.confirm('Have you carefully read this info?')
        if not agree:
            print("You don't YOLO much, do you?")
            exit()


if __name__ == '__main__':
    assist()
