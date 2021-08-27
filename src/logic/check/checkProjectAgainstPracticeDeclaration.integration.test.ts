import { CheckFileEvaluationResult, FileCheckType } from '../../domain';
import { readDeclarePracticesConfig } from '../read/readDeclarePracticesConfig';
import { testAssetsDirectoryPath } from '../__test_assets__/dirPath';
import { checkProjectAgainstPracticeDeclaration } from './checkProjectAgainstPracticeDeclaration';

describe('checkProjectAgainstPracticeDeclaration', () => {
  it('should be able to evaluate a practice with only a best practice', async () => {
    // lookup a practice
    const declarations = await readDeclarePracticesConfig({
      configPath: `${testAssetsDirectoryPath}/example-best-practices-repo/declapract.declare.yml`,
    });
    const practice = declarations.practices.find((practice) => practice.name === 'prettier'); // lets use the "prettier" practice for this one, since its a "best-practice" only one
    if (!practice) fail('should have found a practice');

    // sanity check the practice we'll be using
    expect(practice.badPractices.length).toEqual(0); // check that our expectations for the test are met; should not have any bad practices

    // now evaluate it
    const projectRootDirectory = `${testAssetsDirectoryPath}/example-project-fails-prettier`;
    const evaluation = await checkProjectAgainstPracticeDeclaration({ practice, projectRootDirectory });

    // check that the evaluation matches what we expect
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.FAIL).length).toEqual(2); // 2 out of 3 fail
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.PASS).length).toEqual(1); // 1 out of 3 pass
    expect(evaluation).toMatchSnapshot();
  });
  it('should be able to evaluate a practice with both a best practice and bad practices - and consider passing bad practice checks as failing the practice', async () => {
    // lookup a practice
    const declarations = await readDeclarePracticesConfig({
      configPath: `${testAssetsDirectoryPath}/example-best-practices-repo/declapract.declare.yml`,
    });
    const practice = declarations.practices.find((practice) => practice.name === 'dates-and-times');
    if (!practice) fail('should have found a practice');

    // sanity check the practice we'll be using
    expect(practice.badPractices.length).toBeGreaterThan(0); // check that our expectations for the test are met

    // now evaluate it
    const projectRootDirectory = `${testAssetsDirectoryPath}/example-project-fails-dates-and-times`;
    const evaluation = await checkProjectAgainstPracticeDeclaration({ practice, projectRootDirectory });

    // check that the evaluation matches what we expect
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.FAIL).length).toEqual(1);
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.PASS).length).toEqual(0);
    expect(evaluation.evaluated[0].checked.bestPractice[0].result).toEqual(CheckFileEvaluationResult.PASS);
    expect(evaluation.evaluated[0].checked.badPractices[0].result).toEqual(CheckFileEvaluationResult.PASS);
    expect(evaluation).toMatchSnapshot();
  });
  it('should be able to evaluate a practice with wildcard glob pattern path file checks - fails best practices and passes bad practices', async () => {
    // lookup a practice
    const declarations = await readDeclarePracticesConfig({
      configPath: `${testAssetsDirectoryPath}/example-best-practices-repo/declapract.declare.yml`,
    });
    const practice = declarations.practices.find((practice) => practice.name === 'directory-structure-src');
    if (!practice) fail('should have found a practice');

    // sanity check the practice we'll be using
    expect(practice.badPractices.length).toBeGreaterThan(0); // check that our expectations for the test are met

    // now evaluate it
    const projectRootDirectory = `${testAssetsDirectoryPath}/example-project-fails-directory-structure-src`;
    const evaluation = await checkProjectAgainstPracticeDeclaration({ practice, projectRootDirectory });

    // check that the evaluation matches what we expect
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.FAIL).length).toEqual(7);
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.PASS).length).toEqual(2);

    // sanity check a couple of important texamples
    expect(
      evaluation.evaluated.find((file) => file.path === 'src/logic/**/*.ts'), // note that the file path is still wildcard, since no files were found by that glob
    ).toMatchObject({
      // should have found this file by wildcard _and_ failed it due to the contains check
      result: CheckFileEvaluationResult.FAIL,
      checked: expect.objectContaining({
        bestPractice: expect.arrayContaining([
          expect.objectContaining({
            check: expect.objectContaining({ type: FileCheckType.EXISTS }),
          }),
        ]),
      }),
    });
    expect(evaluation.evaluated.find((file) => file.path === 'src/data/clients/coolServiceClient.ts')).toMatchObject({
      // should have found this file by wildcard _and_ failed it due to the contains check not being satisfied correctly
      result: CheckFileEvaluationResult.FAIL,
      checked: expect.objectContaining({
        bestPractice: expect.arrayContaining([
          expect.objectContaining({
            check: expect.objectContaining({ type: FileCheckType.CONTAINS }),
          }),
        ]),
      }),
    });
    expect(
      evaluation.evaluated.find((file) => file.path === 'src/services/someFile.ts'), // shold have found this file from the bad-practices wildcard glob path
    ).toMatchObject({
      result: CheckFileEvaluationResult.FAIL, // it failed,
      checked: expect.objectContaining({
        bestPractice: [], // no failed best practices
        badPractices: expect.arrayContaining([
          expect.objectContaining({
            result: CheckFileEvaluationResult.PASS, // the fact that it passed bad practice is why it failed
            check: expect.objectContaining({ type: FileCheckType.EXISTS }),
          }),
        ]),
      }),
    });

    // now just save an example of the results
    expect(evaluation).toMatchSnapshot();
  });
  it('should be able to evaluate a practice with wildcard glob pattern path file checks - passes without optionals', async () => {
    // lookup a practice
    const declarations = await readDeclarePracticesConfig({
      configPath: `${testAssetsDirectoryPath}/example-best-practices-repo/declapract.declare.yml`,
    });
    const practice = declarations.practices.find((practice) => practice.name === 'directory-structure-src');
    if (!practice) fail('should have found a practice');

    // sanity check the practice we'll be using
    expect(practice.badPractices.length).toBeGreaterThan(0); // check that our expectations for the test are met

    // now evaluate it
    const projectRootDirectory = `${testAssetsDirectoryPath}/example-project-passes-directory-structure-src-without-optionals`;
    const evaluation = await checkProjectAgainstPracticeDeclaration({ practice, projectRootDirectory });
    // console.log(JSON.stringify(evaluation, null, 2));

    // check that the evaluation matches what we expect
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.FAIL).length).toEqual(0);
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.PASS).length).toEqual(9);

    // sanity check a couple of important texamples
    expect(
      evaluation.evaluated.find((file) => file.path === 'src/contract/handlers/doSomething.ts'), // found this file by wildcard glob path
    ).toMatchObject({
      result: CheckFileEvaluationResult.PASS, // passed, due to existance
      checked: expect.objectContaining({
        bestPractice: expect.arrayContaining([
          expect.objectContaining({
            check: expect.objectContaining({ type: FileCheckType.EXISTS }),
          }),
        ]),
        badPractices: [],
      }),
    });
    expect(
      evaluation.evaluated.find((file) => file.path === 'src/data/clients/**/*.ts'), // did not find any files for this glob path -> glob path is kept
    ).toMatchObject({
      result: CheckFileEvaluationResult.PASS,
      checked: expect.objectContaining({
        bestPractice: expect.arrayContaining([
          expect.objectContaining({
            check: expect.objectContaining({
              required: false, // optional file -> that's why it passed
              type: FileCheckType.CONTAINS,
            }),
          }),
        ]),
      }),
    });
    expect(
      evaluation.evaluated.find((file) => file.path === 'src/model/**/*'), // should not have found any files in the model dir -> glob path is kept in the check
    ).toMatchObject({
      result: CheckFileEvaluationResult.PASS, // it passed, because the bad practice check failed
      checked: expect.objectContaining({
        bestPractice: [], // no failed best practices
        badPractices: expect.arrayContaining([
          expect.objectContaining({
            result: CheckFileEvaluationResult.FAIL, // the fact that it failed bad practice is why it passed
            check: expect.objectContaining({ type: FileCheckType.EXISTS }),
          }),
        ]),
      }),
    });

    // now just save an example of the results
    expect(evaluation).toMatchSnapshot();
  });
  it('should be able to evaluate a practice with wildcard glob pattern path file checks - passes with optionals', async () => {
    // lookup a practice
    const declarations = await readDeclarePracticesConfig({
      configPath: `${testAssetsDirectoryPath}/example-best-practices-repo/declapract.declare.yml`,
    });
    const practice = declarations.practices.find((practice) => practice.name === 'directory-structure-src');
    if (!practice) fail('should have found a practice');

    // sanity check the practice we'll be using
    expect(practice.badPractices.length).toBeGreaterThan(0); // check that our expectations for the test are met

    // now evaluate it
    const projectRootDirectory = `${testAssetsDirectoryPath}/example-project-passes-directory-structure-src-with-optionals`;
    const evaluation = await checkProjectAgainstPracticeDeclaration({ practice, projectRootDirectory });
    // console.log(JSON.stringify(evaluation, null, 2));

    // check that the evaluation matches what we expect
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.FAIL).length).toEqual(0);
    expect(evaluation.evaluated.filter((file) => file.result === CheckFileEvaluationResult.PASS).length).toEqual(9);

    // sanity check a couple of important examples
    expect(
      evaluation.evaluated.find((file) => file.path === 'src/data/clients/svcAwesomeStuff.ts'), // did not find any files for this glob path -> glob path is kept
    ).toMatchObject({
      result: CheckFileEvaluationResult.PASS,
      checked: expect.objectContaining({
        bestPractice: expect.arrayContaining([
          expect.objectContaining({
            check: expect.objectContaining({
              required: false, // optional file -> that's why it passed
              type: FileCheckType.CONTAINS,
            }),
          }),
        ]),
      }),
    });
    expect(
      evaluation.evaluated.find((file) => file.path === 'src/data/dao/superCoolThingDao/index.ts'), // found this file by wildcard glob path
    ).toMatchObject({
      result: CheckFileEvaluationResult.PASS, // passed, due to existance
      checked: expect.objectContaining({
        bestPractice: expect.arrayContaining([
          expect.objectContaining({
            check: expect.objectContaining({ type: FileCheckType.EXISTS }),
          }),
        ]),
        badPractices: [],
      }),
    });
    expect(
      evaluation.evaluated.find((file) => file.path === 'src/model/**/*'), // should not have found any files in the model dir -> glob path is kept in the check
    ).toMatchObject({
      result: CheckFileEvaluationResult.PASS, // it passed, because the bad practice check failed
      checked: expect.objectContaining({
        bestPractice: [], // no failed best practices
        badPractices: expect.arrayContaining([
          expect.objectContaining({
            result: CheckFileEvaluationResult.FAIL, // the fact that it failed bad practice is why it passed
            check: expect.objectContaining({ type: FileCheckType.EXISTS }),
          }),
        ]),
      }),
    });

    // now just save an example of the results
    expect(evaluation).toMatchSnapshot();
  });
});
