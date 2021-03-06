import {
  FileActionPlan,
  FilePracticeEvaluation,
  PracticeDeclaration,
  ProjectVariablesImplementation,
} from '../../../domain';
import { withDurationReporting } from '../../../utils/wrappers/withDurationReporting';
import { evaluateProjectAgainstPracticeDeclarations } from '../evaluate/evaluateProjectAgainstPracticeDeclarations';
import { getRequiredActionForFile } from './getRequiredActionForFile';

/**
 * get the plans required to make a project follow the declared practices
 */
export const getPlansForProject = withDurationReporting(
  'getPlansForProject',
  async ({
    practices,
    projectRootDirectory,
    projectVariables,
  }: {
    practices: PracticeDeclaration[];
    projectRootDirectory: string;
    projectVariables: ProjectVariablesImplementation;
  }) => {
    // evaluate the project against the practices
    const evaluations = await evaluateProjectAgainstPracticeDeclarations({
      practices,
      projectRootDirectory,
      projectVariables,
    });

    // convert each file evaluation in to a plan per file
    const evaluationsPerFile = evaluations.reduce((summary, thisEvaluation) => {
      const currentState = summary[thisEvaluation.path] ?? []; // default to empty array
      return { ...summary, [thisEvaluation.path]: [...currentState, thisEvaluation] }; // append this evaluation
    }, {} as Record<string, FilePracticeEvaluation[]>);

    // compose evaluations into plans
    const plans = Object.entries(evaluationsPerFile).map(
      ([path, evaluations]) =>
        new FileActionPlan({
          path,
          evaluations,
          action: getRequiredActionForFile({ evaluations }),
        }),
    );

    // return the plans
    return plans;
  },
);
