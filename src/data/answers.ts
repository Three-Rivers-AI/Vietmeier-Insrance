// Plain Answers, in the agent's voice. Checked 2026-09-28 against the pages cited per item.
// No dollar amounts, premiums or penalty figures on purpose.

export type Answer = { id: string; q: string; a: string[] };

export const answers: Answer[] = [
  {
    // https://www.medicare.gov/basics/get-started-with-medicare/medicare-basics/working-past-65
    // https://www.medicare.gov/basics/get-started-with-medicare/sign-up/when-does-medicare-coverage-start
    // https://www.medicare.gov/basics/get-started-with-medicare/sign-up/when-can-i-sign-up-for-medicare (under-20-employees note)
    id: 'part-b-work',
    q: 'Do I have to sign up for Part B if I still have work coverage?',
    a: [
      'Often, no. If you or your spouse are still working and covered by that job’s health plan, you can usually wait on Part B without a late penalty.',
      'When the job or the coverage ends, whichever comes first, you have 8 months to sign up. COBRA and retiree coverage do not count as coverage from current work, so they do not stretch that window.',
      'One catch: if the employer has fewer than 20 employees, the work plan may expect Medicare to pay first. Then you may need Part B right away. Ask HR, or ask me and I will help you find out.',
    ],
  },
  {
    // https://www.medicare.gov/health-drug-plans/medigap/basics/how-medigap-works
    // https://www.medicare.gov/basics/get-started-with-medicare/medicare-basics/parts-of-medicare
    id: 'medigap-vs-advantage',
    q: 'What is the difference between Medigap and Medicare Advantage?',
    a: [
      'Medigap works alongside Original Medicare. Medicare pays its share, and your Medigap policy helps pay the rest. You usually add a separate Part D plan for drugs.',
      'Medicare Advantage is a different road. A private plan approved by Medicare bundles Part A, Part B and usually drug coverage into one plan, often with a network of doctors.',
      'You pick one road or the other. You cannot have both a Medigap policy and a Medicare Advantage plan at the same time.',
    ],
  },
  {
    // https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan
    id: 'change-later',
    q: 'Can I change plans later?',
    a: [
      'Yes. Every year from October 15 to December 7 you can switch Medicare Advantage or drug plans, and the change starts January 1.',
      'If you are in a Medicare Advantage plan, there is also a window from January 1 to March 31 to switch plans or go back to Original Medicare.',
      'Some life events open a Special Enrollment Period too, like moving or losing other coverage. Medigap is the exception to watch, and I cover that in the next answer.',
    ],
  },
  {
    // https://www.medicare.gov/health-drug-plans/medigap/basics
    // https://www.medicare.gov/health-drug-plans/medigap/ready-to-buy
    id: 'medigap-timing',
    q: 'Is there a best time to buy a Medigap policy?',
    a: [
      'Yes. You get a 6-month Medigap Open Enrollment Period that starts the first month you have Part B and are 65 or older.',
      'After that window, a company can ask health questions and turn you down in most cases, unless you have a guaranteed issue right. That is why I bring it up early, even if you are leaning toward Medicare Advantage.',
    ],
  },
  {
    // https://www.medicare.gov/health-drug-plans/part-d/basics
    // https://www.medicare.gov/basics/costs/medicare-costs/avoid-penalties
    id: 'part-d',
    q: 'Do I need a drug plan if I do not take many prescriptions?',
    a: [
      'It is worth a close look. If you go without Part D or other creditable drug coverage for too long after you first qualify, a late penalty can be added to your premium for as long as you have the coverage.',
      'Many people pick a plan with a low premium as a safety net. We check your medicines against each plan’s list either way.',
    ],
  },
  {
    // https://www.medicare.gov/basics/get-started-with-medicare/sign-up/how-do-i-sign-up-for-medicare
    id: 'automatic',
    q: 'Will I be signed up for Medicare on my own?',
    a: [
      'If you have been getting Social Security or Railroad Retirement Board benefits for at least 4 months before you turn 65, yes. Your card comes in the mail, with Parts A and B.',
      'If you have not started Social Security yet, you sign up yourself. I can walk you through it on the phone.',
    ],
  },
  {
    // No medicare.gov claim here; agency practice.
    id: 'cost-to-talk',
    q: 'What does it cost to talk with you?',
    a: [
      'Nothing extra. The insurance companies pay me when you enroll, and the price of a plan is the same whether you buy it through me or on your own.',
      'You can call, ask your questions and hang up. I will not add you to a call list.',
    ],
  },
  {
    // https://www.medicare.gov/talk-to-someone
    id: 'what-to-bring',
    q: 'What should I have ready when we talk?',
    a: [
      'Your red, white and blue Medicare card if you have it, a list of your doctors, your pharmacy, and the names and doses of your medicines.',
      'I will never ask for your Social Security number to answer a question. If you want to double-check anything I say, you can always call 1-800-MEDICARE.',
    ],
  },
];
