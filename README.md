declapract
==============

Scalable software best practices. Declare, plan, and apply software practices across code bases.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/declapract.svg)](https://npmjs.org/package/declapract)
[![Codecov](https://codecov.io/gh/uladkasach/declapract/branch/master/graph/badge.svg)](https://codecov.io/gh/uladkasach/declapract)
[![Downloads/week](https://img.shields.io/npm/dw/declapract.svg)](https://npmjs.org/package/declapract)
[![License](https://img.shields.io/npm/l/declapract.svg)](https://github.com/uladkasach/declapract/blob/master/package.json)

# Table of Contents
<!-- toc -->
- [Goals](#goals)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
  - [`declapract help [COMMAND]`](#declapract-help-command)
- [Contribution](#contribution)
<!-- tocstop -->

# Purpose

Scaling software best practices across an organization is difficult - but when done right, is a super power.

`declapract` provides a declarative, scalable, and maintainable way to define, enforce, and evolve software best practices to unlock:
- **systematic knowledge synthesis**
  - practices are declaratively defined with code and explained with readmes
  - so that
    - future travelers can read exactly why a practice was deemed "best" or "bad"
    - future travelers can collaborate on, debate, improve, and manage software practices like code (e.g., with pull requests, issues, etc)
- **automatic knowledge transfer**
  - developers in your org are alerted any time they don't follow a best practice - or use a bad practice!
  - so that
    - knowledge is not siloed to people that have learned through tribal knowledge already what practices are best or bad
    - knowledge can be transferred automatically as part of the automated software development lifecycle (e.g., as part of your cicd-pipeline, exposed in pull-requests)
- **effortless code base monitoring**
  - determine for any code base whether and which software practices it is not adhering to with one command
  - so that
    - you can automatically block code changes that introduce bad practices / don't follow best practices
    - you can easily get check each code base in your organization to get an overview of technical debt
- **scalable technical debt elimination**
  - automatically fix code bases, upgrading them to your best practices and removing bad practices
  - so that
    - you can scale keeping your code bases up to date
    - your developers can get back to adding business value instead of upgrading old project

Software practices are an infrastructure of their own. Its time we manage them like it.

# Usage

There are a few cases for using `declapract`. We'll go over each.

## Case 1: Create a new code base from declared best practices

Similar to `git clone`, but leveraging explicitly declared best practices to create an entirely new project instead.

Example:
```sh
npx declapract clone --declarations=ssh:github.com/path/to-declarations-repo --use-case=your-use-case
```

## Case 2: Add best practice management to a code base

Sets up a code base to follow a set of [declared best practices](#declare-best-practices).

install
```sh
npm install --save-dev declapract
```

configure
```sh
touch ./declapract.use.yml;
echo "
declarations: git@github.com:path/to-declarations.git
useCase: your-use-case
variables:
  variableName: 'variableValue' # the variables required by the  practices
  ...
" >> ./declapract.use.yml;
```

## Case 3: Declare best practices

First, you'll need to create a new repository that will house your declared practices. The best way to do this is to clone our best practices for declaring best practices 😄
```sh
npx declapract --declarations=ssh:github.com/uladkasach/best-practices-declarations --use-case=declare
```

Next, you'll need to declare your practices, use-cases, and examples. See the docs on [declarations](#declarations) to learn how to do this.

# Commands
<!-- commands -->
* [`declapract help [COMMAND]`](#declapract-help-command)

## `declapract help [COMMAND]`

display help for declapract

```
USAGE
  $ declapract help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_
<!-- commandsstop -->


# Declarations

## Declarative Syntax

### Motivation

The core philosophy of `declapract` is:
- **declarative > imperative**:
  - define _what_ you want/dont-want to see, not _how_ to check it
  - why?
    - declarative definitions are much easier to read, understand, and maintain - making it easier to use and collaborate on
  - note:
    - although `declapract` still lets you imperatively define custom `check` functions, you should be writing your checks declaratively in most cases.
    - _if you find a common use case that you can't write declaratively, open up an issue so we can get it supported!_
- **a automatic fix for everything**
  - files that fail checks should have a fix that can easily be applied
  - why?
    - upgrading projects typically takes a lot of manual engineering work. automated fixes let you move faster by defining how to fix a failure once - and easily apply it across all code bases
  - note
    - declapract defines these fixes for you on as many of the declarations as often - but you may need to explicitly define the fix in some cases yourself

### Implementation

`declapract` enables you to define your best-practices and bad-practices by showing examples of what you want/dont-want the files in the projects you're checking to look like - with customizations added by metadata files.

For example, a file structure such as this:
```
- src/
  - practices/
    - terraform/
      - best-practice/
        - .terraform-version
        - terraform/
          - modules/
            - main.tf.declapract.ts
            - sqs.tf.declapract.ts
          - environments/
            - prod/
              - main.tf
              - main.tf.declapract.ts
            - dev
              - main.tf
              - main.tf.declapract.ts
      - bad-practices/
        - tfvars/
          - terraform/
            - **/
              - *.tfvars.declapract.ts
```
tells us that we have one `best-practice` and one `bad-practice` defined.

The `best-practice` directory declares an example of what a project following the best practice looks like, with some `declapract` metadata files that allow us to customize what to check for.

The `best-practice`, in this example, checks several files. For example:
- `.terraform-version` has its expected contents declared
  - which means that projects using this practice will need
    - a file with path `.terraform-version` to exist (it is required, by default)
    - the file the match the exact file contents declared here (the check type is FileCheckType.EXACT, when file contents are declared, by default)
- `terraform/modules/main.tf` has a metadata file declared for it, `terraform/modules/main.tf.declapract.tf`
  - this could mean multiple things, as the metadata file gives you lots of customization over what to check
  - for example:
    - there may be a custom check defined
    - the file may just need to be checked for existence
  - see more details about the file-check-metadata file below
- `terraform/environments/prod/main.tf` has both: a file declaring expected contents and a metadata file
  - the fact that the user declared expected contents means that they likely want to use them in the check
  - the presence of the metadata file could mean many things
    - the user may have just wanted to define a custom `fix` function
    - the user may have wanted to check that the file `contains` the declared contents, instead of the default `exact equals` check
    - the user may have also wanted to specify that the existence of this file is optional
  - we'd have to read the contents of the file-check-metadata file to find out for sure, but these are the options above

The `bad-practice` directory, on the other hand, declares an example of what _not_ to do; i.e., what a project that followed this bad practice would look like. It too includes `declapract` metadata files in order to customize what to check for, for each file.

The `bad-practice` `bad-practices/tfvars`, in this example, can check many files even though it only declares one checks:
- `terraform/**/*.tfvars` is the glob pattern for the files to check declared by this `bad-practice`
  - this means that the check defined here will apply to _all_ files that match the `terraform/**/*.tfvars` glob pattern, if any

## Practices

Practices are coding patterns that you either want to require in projects - or forbid in projects. Practices are defined in a declarative way by defining the files that are relevant to the practice and how to check them. Practices are defined through the example of a `best-practice` or one or more `bad-practices` (or both).

The name of a practice is defined by the name of the directory its declarations live in. For example, a directory named `practices/terraform/` would house the `terraform` practice.

Practices can have up to one best-practice and any number of bad-practices declared. These, too, are identified by directory structure. For example, `practices/terraform/best-practice` will house the best-practice declaration for terraform - and `practices/terraform/bad-practices/tfvars` would house a bad-practice declaration.

Both `best-practice` and `bad-practice` declarations are defined in the same way, by declaring an example of a project that should be matched against. In other words, you'll define the files you want to check by defining them just like you would in a real project - and you'll define how to check them by declaring their contents, metadata, or a custom check function.

### File Check Declaration Examples

#### `FileCheckType.EQUALS`

The most straight forward file check type is the "exact contents" file check. Its used to check that a file's contents exactly equal the contents you declare.

To define one of these, simply declare the contents of the file you want to check.

For example,
- declare `practices/terraform/best-practice/.terraform-version` as:
```
0.14.11
```

When you check a project against this practice, declapract will make sure that a file named `.terraform-version` is defined at path `<root>/.terraform-version` and that its contents exactly equal what is declared in that file: `0.14.11`.

#### `FileCheckType.CONTAINS`

Another common file check type is the "contains contents" file check. Its used to check that a file's contents contain the contents you declare.

To define one of these, declare the contents that you want to see contained in the file matching the file path - and then additionally define a file-check-metadata file for that file's path and use it to specify that the check type should be `CONTAINS`.

For example:
- declare `practices/git/best-practice/.gitignore` as
```
dist
node_modules
coverage
.serverless
.env
.terraform
.terraform.lock
```
- declare `practices/git/best-practice/.gitignore.declapract.ts` as
```ts
import { FileCheckType } from 'declapract';

export const check = FileCheckType.CONTAINS;
```

When you check a project against this practice, declapract will make sure that a file named `.gitignore` is defined at path `<root>/.gitignore` and that its contents contain what is declared in `practices/git/best-practice/.gitignore`

#### `FileCheckType.EXISTS`

Another common file check type is the "exists" file check. As you'd expect, its used to check whether a file exists.

To define one of these, simply define a file-check-metadata file for that file's path and specify that the check type should be `EXISTS`.

**for defining a best practice**

For example:
- declare `practices/npm/best-practice/package-lock.json.declapract.ts` as:
```ts
import { FileCheckType } from 'declapract';

export const check = FileCheckType.EXISTS;
```

**for defining a bad practice**
A more common use case for this is to define a `bad-practice` and check that a file does not exist.

For example:
- declare `practices/directory-structure/bad-practices/models-dir/src/models/**/*.ts.declapract.ts` as:
```ts
import { FileCheckType } from 'declapract';

export const check = FileCheckType.EXISTS;
```

When you check a project against this practice, declapract will make sure that no files match the path `<root>/src/models/**/*.ts`. Note that in this example we specified a `bad-practice`, which is why declapract will make sure that files which match the `EXISTS` check for this path do _not_ exist.

#### custom

When the above checks dont meet your needs, you are able to declare a custom check for files that match a file path.

To define one of these, simply define a file-check-metadata file for that file's path and specify a custom check function.

For example:
- declare `practices/npm/best-practice/package.json.declapract.ts`
```ts
import { FileCheckFunction, FileCheckContext } from 'declapract';

export const check: FileCheckFunction = (contents: string | null, context: FileCheckContext) => {
  expect(contents).not.toEqual(null);
  expect(JSON.parse(contents)).toMatchObject({ private: true }); // check that all package.json files say "private: true"
}
```


# To Do

Todo: update the readme to better document how to define FileCheckDeclarations and PracticeDeclarations
- variables
- fixes
- more clear examples
- best practice -vs- bad practices
- syntax on defining custom check functions
- etc

# Contribution

Team work makes the dream work! Please create a ticket for any features you think are missing and, if willing and able, draft a PR for the feature :)
