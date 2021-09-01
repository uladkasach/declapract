import { getPlansForProject } from '../plan/get/getPlansForProject';
import { readUsePracticesConfig } from '../config/readUsePracticesConfig';
import { UnexpectedCodePathError } from '../UnexpectedCodePathError';
import { filterPracticeEvaluationsFromPlans } from '../plan/filterPracticeEvaluationsFromPlans';
import { applyPlans } from '../plan/apply/applyPlans';
import { RequiredAction } from '../../domain';

export const apply = async ({
  usePracticesConfigPath,
  filter,
}: {
  usePracticesConfigPath: string;
  filter?: {
    practiceNames?: string[];
  };
}) => {
  // read the usage config
  const config = await readUsePracticesConfig({ configPath: usePracticesConfigPath });

  // grab the selected use case's practices
  const useCase = config.declared.useCases.find((useCase) => useCase.name === config.useCase);
  if (!useCase)
    throw new UnexpectedCodePathError(
      'requested use case was not defined on config. should have thrown an error when processing the config by now',
    );

  // get plans for this project
  const plans = await getPlansForProject({ practices: useCase.practices, projectRootDirectory: config.rootDir });

  // filter out the practices to the ones that can be automatically applied + for the practices specified
  const plansToApply = (
    await filterPracticeEvaluationsFromPlans({
      plans,
      filter: { byFixable: true, byPracticeNames: filter?.practiceNames ?? undefined },
    })
  ).filter((plan) => plan.action === RequiredAction.FIX_AUTOMATIC);

  // display the plans
  await applyPlans({ plans: plansToApply, projectRootDirectory: config.rootDir });
};
