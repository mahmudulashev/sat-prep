import { text, type SubjectBank } from "./schema.ts";

const CS = "Craft and Structure";
const II = "Information and Ideas";
const SEC = "Standard English Conventions";
const EOI = "Expression of Ideas";

const COMPLETE_WORD = "Which choice completes the text with the most logical and precise word or phrase?";
const CONVENTIONS = "Which choice completes the text so that it conforms to the conventions of Standard English?";
const TRANSITION = "Which choice completes the text with the most logical transition?";
const NOTES = "While researching a topic, a student has taken the following notes:";

export const english: SubjectBank = {
  subject: "english",
  questions: [
    // -----------------------------------------------------------------------
    // Craft and Structure — Words in Context
    // -----------------------------------------------------------------------
    {
      id: "en-wic-01",
      domain: CS,
      skill: "Words in Context",
      difficulty: "easy",
      stimulus: [
        text(
          "The marine biologist's field notes were remarkably ___: every entry recorded the date, the water temperature, and the exact coordinates of each sighting.",
        ),
      ],
      prompt: COMPLETE_WORD,
      choices: ["careless", "meticulous", "brief", "speculative"],
      answer: "B",
      explanation:
        "The colon introduces evidence of extreme care and precision (date, temperature, exact coordinates). \"Meticulous\" means showing great attention to detail, so it fits. \"Careless\" and \"speculative\" contradict the detail, and \"brief\" doesn't match notes that record so much.",
    },
    {
      id: "en-wic-02",
      domain: CS,
      skill: "Words in Context",
      difficulty: "medium",
      stimulus: [
        text(
          "Although the novelist's early work was dismissed by critics as derivative, her later books were praised for their ___, introducing narrative techniques that other writers soon began to imitate.",
        ),
      ],
      prompt: COMPLETE_WORD,
      choices: ["originality", "familiarity", "length", "restraint"],
      answer: "A",
      explanation:
        "\"Although\" signals a contrast with \"derivative\" (copied from others). Books that introduce techniques others imitate show originality. \"Familiarity\" repeats the criticism, and \"length\" and \"restraint\" aren't supported by the text.",
    },
    {
      id: "en-wic-03",
      domain: CS,
      skill: "Words in Context",
      difficulty: "medium",
      stimulus: [
        text(
          "In 1856, eighteen-year-old chemist William Perkin was trying to synthesize the drug quinine when he ___ produced mauveine, the first synthetic dye; he had not set out to create a dye at all.",
        ),
      ],
      prompt: COMPLETE_WORD,
      choices: ["deliberately", "reluctantly", "accidentally", "gradually"],
      answer: "C",
      explanation:
        "The text says Perkin \"had not set out to create a dye at all,\" so the dye was produced by accident. \"Deliberately\" contradicts this, and nothing suggests he was reluctant or that the discovery was gradual.",
    },
    {
      id: "en-wic-04",
      domain: CS,
      skill: "Words in Context",
      difficulty: "hard",
      stimulus: [
        text(
          "Urban ecologist Priya Raman argues that when budgets tighten, city parks are too often treated as ___ amenities—pleasant but expendable—even though her research shows that parks substantially lower summer temperatures in surrounding neighborhoods.",
        ),
      ],
      prompt: COMPLETE_WORD,
      choices: ["essential", "ancillary", "controversial", "innovative"],
      answer: "B",
      explanation:
        "The phrase \"pleasant but expendable\" defines the blank: something secondary or supplementary. \"Ancillary\" means providing support but not essential. \"Essential\" is the opposite of the officials' view that Raman criticizes.",
    },
    {
      id: "en-wic-05",
      domain: CS,
      skill: "Words in Context",
      difficulty: "hard",
      stimulus: [
        text(
          "The historian's account does not ___ the role that merchants played in the city's growth; rather, it argues that their influence has been overstated by earlier scholars, who relied almost exclusively on the merchants' own letters.",
        ),
      ],
      prompt: COMPLETE_WORD,
      choices: ["exaggerate", "dismiss", "document", "celebrate"],
      answer: "B",
      explanation:
        "\"Rather\" contrasts what the account does not do with what it does: it says the merchants' influence was overstated, not that it was nonexistent. So the account does not dismiss their role entirely. \"Exaggerate\" would contradict the argument that others overstated it.",
    },
    {
      id: "en-wic-06",
      domain: CS,
      skill: "Words in Context",
      difficulty: "medium",
      stimulus: [
        text(
          "Before approving the bridge design, the review board asked an independent engineer to check every calculation. Her report concluded that the plan was *sound*: the structure could safely carry more than twice the expected traffic load.",
        ),
      ],
      prompt: "As used in the text, what does the word \"sound\" most nearly mean?",
      choices: ["noisy", "reliable", "complete", "deep"],
      answer: "B",
      explanation:
        "The report explains that the structure could safely carry more than twice the expected load, which shows the plan is dependable. In this context \"sound\" means reliable or well founded.",
    },

    {
      id: "en-wic-07",
      domain: CS,
      skill: "Words in Context",
      difficulty: "hard",
      stimulus: [
        text(
          "Physicist Lise Meitner's role in the discovery of nuclear fission was long ___: although she helped provide the first theoretical explanation of the key experiment, the 1944 Nobel Prize in Chemistry was awarded to her collaborator Otto Hahn alone.",
        ),
      ],
      prompt: COMPLETE_WORD,
      choices: ["overlooked", "exaggerated", "disputed", "publicized"],
      answer: "A",
      explanation:
        "The colon introduces evidence that Meitner didn't receive credit: the prize went to Hahn alone. Her role was therefore overlooked. Nothing suggests it was exaggerated or widely publicized.",
    },
    // -----------------------------------------------------------------------
    // Craft and Structure — Text Structure and Purpose
    // -----------------------------------------------------------------------
    {
      id: "en-tsp-01",
      domain: CS,
      skill: "Text Structure and Purpose",
      difficulty: "medium",
      stimulus: [
        text(
          "Octopuses have long puzzled biologists. With a nervous system spread largely through their arms, they can solve mazes, unscrew jar lids, and recognize individual human faces. Yet octopuses live only one to two years and receive no instruction from their parents, which die shortly after the eggs hatch. Researchers are therefore trying to understand how such complex abilities evolved in an animal with so little time to use them.",
        ),
      ],
      prompt: "Which choice best describes the overall structure of the text?",
      choices: [
        "It describes impressive abilities of octopuses, then presents features of their lives that make those abilities puzzling.",
        "It presents a theory about octopus intelligence and then offers evidence that disproves it.",
        "It compares octopuses with other animals and concludes that octopuses are the most intelligent.",
        "It explains how octopuses learn from their parents and then describes an experiment.",
      ],
      answer: "A",
      explanation:
        "The text first lists abilities (mazes, jars, faces), then uses \"Yet\" to introduce the short lifespan and lack of parental teaching, which make those abilities puzzling. No theory is disproved, no comparison is made, and the text says octopuses do not learn from parents.",
    },
    {
      id: "en-tsp-02",
      domain: CS,
      skill: "Text Structure and Purpose",
      difficulty: "easy",
      stimulus: [
        text(
          "In 2011, Mexican American artist Judith Baca began restoring sections of *The Great Wall of Los Angeles*, a half-mile-long mural she first designed in 1974. The mural, painted along a flood-control channel, depicts California's history from the perspective of communities often left out of textbooks. The restoration, carried out with teams of young local artists, was meant not only to repair fading paint but also to pass the skills of mural making on to a new generation.",
        ),
      ],
      prompt: "Which choice best states the main purpose of the text?",
      choices: [
        "To argue that murals should not be painted outdoors",
        "To describe a mural and explain the goals of an effort to restore it",
        "To compare Baca's mural with other murals in Los Angeles",
        "To criticize textbooks for leaving out parts of California's history",
      ],
      answer: "B",
      explanation:
        "The text introduces the mural, describes what it depicts, and explains that the restoration aimed both to repair it and to teach young artists. The other choices focus on details the text doesn't develop.",
    },
    {
      id: "en-tsp-03",
      domain: CS,
      skill: "Text Structure and Purpose",
      difficulty: "medium",
      stimulus: [
        text(
          "Many people assume that deserts are silent places. ++In fact, the sand dunes of the Sahara and several other deserts can produce a low, droning hum that is audible from kilometers away.++ Scientists have found that the sound occurs when sand grains of a particular size slide down the steep face of a dune in a synchronized avalanche. The pitch of the hum depends on the size of the grains rather than on the shape of the dune.",
        ),
      ],
      prompt: "Which choice best describes the function of the underlined sentence in the text as a whole?",
      choices: [
        "It presents a hypothesis that the scientists mentioned later reject.",
        "It provides an example of how deserts differ from all other environments.",
        "It introduces a phenomenon that challenges a common assumption and is explained in the rest of the text.",
        "It summarizes the findings of the research described in the text.",
      ],
      answer: "C",
      explanation:
        "The underlined sentence contradicts the assumption that deserts are silent by introducing humming dunes, and the following sentences explain what causes the hum. It is not a rejected hypothesis or a summary.",
    },
    {
      id: "en-tsp-04",
      domain: CS,
      skill: "Text Structure and Purpose",
      difficulty: "hard",
      stimulus: [
        text(
          "When automated teller machines (ATMs) spread in the 1970s and 1980s, some economists predicted that the number of bank tellers in the United States would fall sharply. Instead, the number of tellers grew over the following decades. Because ATMs lowered the cost of running a branch, banks opened many more branches, and tellers increasingly took on tasks such as advising customers—work that machines could not easily do.",
        ),
      ],
      prompt: "Which choice best states the main purpose of the text?",
      choices: [
        "To argue that ATMs should eventually replace bank tellers",
        "To describe how ATMs process transactions",
        "To explain why economists study the banking industry",
        "To show that a new technology affected employment differently than some had predicted",
      ],
      answer: "D",
      explanation:
        "The text contrasts a prediction (tellers would disappear) with the outcome (tellers increased) and explains why. Its purpose is to show that the technology's effect on jobs differed from expectations.",
    },

    {
      id: "en-tsp-05",
      domain: CS,
      skill: "Text Structure and Purpose",
      difficulty: "medium",
      stimulus: [
        text(
          "Sea turtles hatch on beaches at night and must reach the ocean quickly. For decades, researchers assumed that hatchlings found the water by following the sound of breaking waves. Experiments have since shown that hatchlings instead crawl toward the brightest horizon, which on an undeveloped beach is usually the open sea. This finding explains why artificial lights near beaches can lead hatchlings in the wrong direction.",
        ),
      ],
      prompt: "Which choice best describes the overall structure of the text?",
      choices: [
        "It describes a problem facing sea turtles and proposes several possible solutions.",
        "It presents an earlier assumption, describes findings that replaced it, and notes a consequence of those findings.",
        "It compares the behavior of two species of sea turtles.",
        "It argues that most research on sea turtles has been unreliable.",
      ],
      answer: "B",
      explanation:
        "The text states an old assumption (sound), replaces it with newer evidence (brightest horizon), and ends with an implication (artificial lights mislead hatchlings). No solutions or species comparisons are offered.",
    },
    // -----------------------------------------------------------------------
    // Craft and Structure — Cross-Text Connections
    // -----------------------------------------------------------------------
    {
      id: "en-ctc-01",
      domain: CS,
      skill: "Cross-Text Connections",
      difficulty: "hard",
      stimulus: [
        text(
          "Many researchers have argued that dog domestication began when wolves scavenged near human camps. Over generations, the wolves least afraid of people were the ones that thrived near settlements, gradually becoming tamer and eventually dependent on humans.",
          "Text 1",
        ),
        text(
          "Geneticist Laila Morgan questions whether scavenging alone can explain domestication. Early human groups in cold regions, she notes, often had little surplus meat to leave behind. Morgan proposes instead that people actively captured and raised wolf pups, deliberately keeping the calmest animals.",
          "Text 2",
        ),
      ],
      prompt:
        "Based on the texts, how would Morgan (Text 2) most likely respond to the explanation described in Text 1?",
      choices: [
        "By agreeing that tamer wolves had an advantage but arguing that humans played a more deliberate role than the explanation suggests",
        "By arguing that dogs were domesticated from an animal other than the wolf",
        "By claiming that early humans did not live in cold regions",
        "By insisting that tameness gave wolves no advantage near human settlements",
      ],
      answer: "A",
      explanation:
        "Morgan still thinks calm animals were favored (people kept \"the calmest animals\"), but she argues humans chose them deliberately rather than wolves drifting toward camps on their own. She doesn't dispute that dogs came from wolves.",
    },
    {
      id: "en-ctc-02",
      domain: CS,
      skill: "Cross-Text Connections",
      difficulty: "medium",
      stimulus: [
        text(
          "Four-day workweeks are often promoted as a way to improve employees' well-being. In a widely reported 2022 trial in the United Kingdom, most participating companies kept the shorter schedule after the trial ended, and employees reported lower levels of stress.",
          "Text 1",
        ),
        text(
          "Results from trials of shorter workweeks should be interpreted carefully. Companies chose to join the 2022 trial, so they may have been especially well suited to a shorter schedule. Organizations such as hospitals, which must operate around the clock, could face very different challenges.",
          "Text 2",
        ),
      ],
      prompt:
        "Based on the texts, how would the author of Text 2 most likely characterize the findings described in Text 1?",
      choices: [
        "As evidence that shorter workweeks increase stress",
        "As inaccurate because companies misreported their results",
        "As possibly not applicable to every type of organization",
        "As proof that hospitals should adopt a four-day workweek",
      ],
      answer: "C",
      explanation:
        "Text 2 points out that the participating companies volunteered and that round-the-clock organizations might differ, so the findings may not generalize. It doesn't claim the results were misreported or wrong.",
    },

    // -----------------------------------------------------------------------
    // Information and Ideas — Central Ideas and Details
    // -----------------------------------------------------------------------
    {
      id: "en-cid-01",
      domain: II,
      skill: "Central Ideas and Details",
      difficulty: "easy",
      stimulus: [
        text(
          "Mara had lived in the city for eleven years, but each spring she still found herself drawn back to her grandmother's farm. She told her friends it was for the fresh air. The truth was harder to explain: only there, among the rows of pear trees her grandmother had planted, did she feel that the pieces of her life fit together.",
        ),
      ],
      prompt: "Which choice best states the main idea of the text?",
      choices: [
        "Mara prefers living in the city to living in the countryside.",
        "Mara's friends do not understand why she enjoys fresh air.",
        "Mara plans to become a farmer like her grandmother.",
        "Mara returns to the farm because it gives her a sense of belonging that is hard to put into words.",
      ],
      answer: "D",
      explanation:
        "The key sentence says the real reason is \"harder to explain\": the farm makes her feel that her life fits together. That is a sense of belonging. The text never says she plans to farm or compares city and country.",
    },
    {
      id: "en-cid-02",
      domain: II,
      skill: "Central Ideas and Details",
      difficulty: "medium",
      stimulus: [
        text(
          "Research by ecologist Tomás Herrera suggests that coffee farms that keep native trees growing among the coffee plants support far more bird species than farms that clear the trees. Some farmers worry that shade reduces coffee yields. Herrera found, however, that birds on shaded farms ate enough crop-damaging insects to offset much of the yield lost to shade.",
        ),
      ],
      prompt: "Which choice best states the main idea of the text?",
      choices: [
        "Keeping shade trees on coffee farms can benefit both birds and farmers.",
        "Coffee farmers should stop growing coffee in forested areas.",
        "Birds are the main cause of damage to coffee crops.",
        "Most of the world's coffee is grown without shade trees.",
      ],
      answer: "A",
      explanation:
        "Shaded farms support more bird species, and those birds eat insects that damage crops, offsetting yield losses. So shade trees help both birds and farmers. The birds protect crops rather than damage them.",
    },
    {
      id: "en-cid-03",
      domain: II,
      skill: "Central Ideas and Details",
      difficulty: "hard",
      stimulus: [
        text(
          "The Voynich manuscript, a fifteenth-century book written in an unknown script, has resisted a century of decoding attempts. Some scholars have concluded that it is an elaborate hoax. Linguist Rhea Sato disagrees, pointing out that the frequency with which certain \"words\" appear in the manuscript follows the same statistical pattern found in natural languages—a pattern that a medieval forger would have had no reason to know about, let alone reproduce.",
        ),
      ],
      prompt: "According to the text, why does Sato doubt that the manuscript is a hoax?",
      choices: [
        "The manuscript's script closely resembles a known medieval alphabet.",
        "Many scholars have successfully translated portions of the manuscript.",
        "Word patterns in the manuscript match those of natural languages in a way a forger would be unlikely to imitate.",
        "The manuscript was written much more recently than scholars once believed.",
      ],
      answer: "C",
      explanation:
        "Sato's reasoning is that the word-frequency pattern matches natural languages, and a medieval forger wouldn't have known to reproduce it. The text says the script is unknown and hasn't been decoded.",
    },

    {
      id: "en-cid-04",
      domain: II,
      skill: "Central Ideas and Details",
      difficulty: "medium",
      stimulus: [
        text(
          "In the 1930s, photographer Dorothea Lange traveled across the American West documenting families displaced by drought and economic hardship. Rather than photographing crowds, Lange usually focused on individuals, often waiting until her subjects grew comfortable with her presence. The resulting portraits, such as *Migrant Mother* (1936), gave audiences across the country a personal view of the era's hardships.",
        ),
      ],
      prompt: "Which choice best states the main idea of the text?",
      choices: [
        "Lange preferred photographing large crowds to photographing individuals.",
        "Lange's work was mostly unknown to audiences during the 1930s.",
        "Lange's patient, close portraits of individuals helped audiences understand the hardships of the 1930s.",
        "Lange stopped working as a photographer after 1936.",
      ],
      answer: "C",
      explanation:
        "The text emphasizes Lange's focus on individuals, her patience, and the portraits' effect on national audiences. Choice A contradicts the text, and B and D aren't supported.",
    },
    // -----------------------------------------------------------------------
    // Information and Ideas — Command of Evidence (Textual)
    // -----------------------------------------------------------------------
    {
      id: "en-coe-01",
      domain: II,
      skill: "Command of Evidence",
      difficulty: "medium",
      stimulus: [
        text(
          "Biologist Anika Rhodes hypothesizes that honeybees learn to associate a particular color with a sugar reward more quickly in warm conditions than in cool conditions.",
        ),
      ],
      prompt: "Which finding, if true, would most directly support Rhodes's hypothesis?",
      choices: [
        "Honeybees visited blue flowers more often than yellow flowers.",
        "Bees trained at 28°C learned to link a color with sugar in fewer trials than bees trained at 18°C.",
        "Bees kept in cool conditions produced more honey than bees kept in warm conditions.",
        "Honeybees can detect ultraviolet light that humans cannot see.",
      ],
      answer: "B",
      explanation:
        "The hypothesis compares learning speed in warm versus cool conditions. Only choice B compares how quickly bees learned a color–sugar association at a warmer and a cooler temperature, with the warm group learning faster.",
    },
    {
      id: "en-coe-02",
      domain: II,
      skill: "Command of Evidence",
      difficulty: "hard",
      stimulus: [
        text(
          "In the poem \"Night Harbor,\" the speaker presents the harbor as a place that offers both comfort and unease.",
        ),
      ],
      prompt: "Which quotation from \"Night Harbor\" most effectively illustrates the claim?",
      choices: [
        "\"The boats return at dusk, one by one, / their hulls still bright with the afternoon.\"",
        "\"The gulls have folded into sleep / along the long gray fingers of the pier.\"",
        "\"Tomorrow the nets go out again at four; / tomorrow, the same salt, the same slow tide.\"",
        "\"The lanterns hum their small and steady songs, / yet something in the black water waits.\"",
      ],
      answer: "D",
      explanation:
        "Choice D pairs a comforting image (lanterns' \"small and steady songs\") with an uneasy one (\"something in the black water waits\"), linked by \"yet.\" The other quotations each convey a single mood.",
    },
    {
      id: "en-coe-03",
      domain: II,
      skill: "Command of Evidence",
      difficulty: "medium",
      stimulus: [
        text(
          "Sociologist Marcus Bell claims that public libraries now serve as important community gathering places, not just as places to borrow books.",
        ),
      ],
      prompt: "Which finding, if true, would most directly support Bell's claim?",
      choices: [
        "The number of books borrowed from public libraries fell over the past decade.",
        "Libraries in large cities hold more books than libraries in small towns.",
        "Most public libraries in the country were built before 1950.",
        "A survey found that over half of library visitors came to attend events, use computers, or meet others rather than to borrow books.",
      ],
      answer: "D",
      explanation:
        "Bell's claim is that libraries function as community spaces. Evidence that most visitors come for events, computers, or meeting people directly supports it. Falling book loans alone doesn't show that libraries are gathering places.",
    },

    // -----------------------------------------------------------------------
    // Information and Ideas — Command of Evidence (Quantitative)
    // -----------------------------------------------------------------------
    {
      id: "en-coq-01",
      domain: II,
      skill: "Command of Evidence",
      difficulty: "medium",
      stimulus: [
        {
          type: "table",
          title: "Average Daily Recreational Screen Time (hours)",
          headers: ["Age group", "Weekdays", "Weekends"],
          rows: [
            ["8–12 years", "4.4", "5.6"],
            ["13–18 years", "7.1", "8.6"],
          ],
        },
        text(
          "A researcher studying young people's media habits noted that children and teenagers alike spend more time on screens on weekends than on weekdays. For example, ___",
        ),
      ],
      prompt: "Which choice most effectively uses data from the table to complete the example?",
      choices: [
        "teenagers averaged more screen time on weekdays than children ages 8–12 did.",
        "children ages 8–12 averaged 5.6 hours of screen time on weekends.",
        "teenagers averaged 7.1 hours on weekdays and 8.6 hours on weekends, while children ages 8–12 averaged 4.4 and 5.6 hours, respectively.",
        "children ages 8–12 averaged more screen time on weekdays than teenagers did on weekends.",
      ],
      answer: "C",
      explanation:
        "The claim concerns both groups and compares weekends with weekdays. Choice C gives both values for both groups, showing weekend time is higher for each. Choice D is false (4.4 < 8.6), and A and B don't make the weekday–weekend comparison for both groups.",
    },
    {
      id: "en-coq-02",
      domain: II,
      skill: "Command of Evidence",
      difficulty: "hard",
      stimulus: [
        {
          type: "figure",
          caption: "Seed Germination by Soil Type",
          figure: {
            kind: "bar",
            yLabel: "Seeds germinated (%)",
            xLabel: "Soil type",
            y: [0, 100, 20],
            bars: [
              { label: "Sandy", value: 42 },
              { label: "Loam", value: 78 },
              { label: "Clay", value: 55 },
              { label: "Loam + compost", value: 91 },
            ],
          },
        },
        text(
          "For a science fair project, a student hypothesized that adding compost to loam soil would increase the percentage of seeds that germinate compared with loam soil alone. The data in the graph ___",
        ),
      ],
      prompt: "Which choice most effectively uses data from the graph to complete the statement?",
      choices: [
        "support the hypothesis, because 91% of seeds germinated in loam with compost, compared with 78% in loam alone.",
        "support the hypothesis, because more seeds germinated in clay soil than in sandy soil.",
        "weaken the hypothesis, because only 42% of seeds germinated in sandy soil.",
        "weaken the hypothesis, because 78% of seeds germinated in loam soil.",
      ],
      answer: "A",
      explanation:
        "The hypothesis compares loam + compost with loam alone. The graph shows 91% versus 78%, so the data support it. Clay and sandy soil are irrelevant to this comparison.",
    },
    {
      id: "en-coq-03",
      domain: II,
      skill: "Command of Evidence",
      difficulty: "medium",
      stimulus: [
        {
          type: "table",
          title: "Riverton Bike-Share Trips (thousands per year)",
          headers: ["Year", "Electric bikes", "Standard bikes"],
          rows: [
            ["2021", "12", "48"],
            ["2022", "25", "46"],
            ["2023", "41", "44"],
          ],
        },
        text(
          "Riverton's bike-share program added electric bikes in 2021. City planners noted that the electric bikes quickly grew in popularity while use of standard bikes stayed fairly stable. By 2023, ___",
        ),
      ],
      prompt: "Which choice most effectively uses data from the table to complete the statement?",
      choices: [
        "electric bikes accounted for 12 thousand trips.",
        "standard bikes accounted for more than 48 thousand trips.",
        "electric bike trips had fallen below 25 thousand.",
        "electric bike trips had risen to 41 thousand, while standard bike trips were 44 thousand, down only slightly from 48 thousand in 2021.",
      ],
      answer: "D",
      explanation:
        "The statement describes two trends: electric bikes growing and standard bikes staying stable. Choice D shows both with accurate 2023 values. The other choices misstate the data.",
    },

    // -----------------------------------------------------------------------
    // Information and Ideas — Inferences
    // -----------------------------------------------------------------------
    {
      id: "en-inf-01",
      domain: II,
      skill: "Inferences",
      difficulty: "medium",
      stimulus: [
        text(
          "At a coastal site in present-day Peru, archaeologists found cotton fishing nets dating to about 5,000 years ago but no farming tools or stored grain from the same period. Because cotton must be cultivated, the nets suggest that ___",
        ),
      ],
      prompt: "Which choice most logically completes the text?",
      choices: [
        "the people at the site grew at least some crops, even though evidence of grain farming has not been found.",
        "the people at the site did not rely on fishing for food.",
        "cotton was not used to make nets until thousands of years later.",
        "the site was abandoned before cotton was first cultivated.",
      ],
      answer: "A",
      explanation:
        "Since cotton must be cultivated, cotton nets imply that someone was growing a crop, even without grain or farming tools. The nets also show the people fished, contradicting choice B.",
    },
    {
      id: "en-inf-02",
      domain: II,
      skill: "Inferences",
      difficulty: "hard",
      stimulus: [
        text(
          "Young male zebra finches normally learn their songs by imitating adult males. When researchers raised finches in isolation, the birds developed unusual, irregular songs. The researchers then had young birds learn from these isolated \"tutors,\" and had each new generation learn from the one before. Over several generations, the songs gradually became more like those of wild zebra finches. This finding suggests that ___",
        ),
      ],
      prompt: "Which choice most logically completes the text?",
      choices: [
        "zebra finches are unable to learn songs from other birds.",
        "zebra finches have an inborn tendency that pushes their songs toward the typical wild form.",
        "wild zebra finch songs change unpredictably from one generation to the next.",
        "raising finches in isolation improves the quality of their songs.",
      ],
      answer: "B",
      explanation:
        "Even though each generation learned from birds with irregular songs, the songs drifted back toward the wild form. That suggests something innate guides song development. The birds clearly did learn from tutors, so A is wrong.",
    },
    {
      id: "en-inf-03",
      domain: II,
      skill: "Inferences",
      difficulty: "easy",
      stimulus: [
        text(
          "Many popular houseplants originated on the floors of tropical forests, where they grew in the shade of much taller trees. As a result, many of these plants ___",
        ),
      ],
      prompt: "Which choice most logically completes the text?",
      choices: [
        "need direct sunlight for most of the day.",
        "grow best in hot, dry desert conditions.",
        "can thrive in the indirect light found inside most homes.",
        "cannot survive indoors for more than a few weeks.",
      ],
      answer: "C",
      explanation:
        "Plants adapted to shade beneath tall trees are suited to low, indirect light, which is similar to the light inside homes. The other choices contradict their shady origins.",
    },

    {
      id: "en-inf-04",
      domain: II,
      skill: "Inferences",
      difficulty: "hard",
      stimulus: [
        text(
          "Many fig species can be pollinated by only one particular species of wasp, and those wasps can reproduce only inside the flowers of that fig species. On a remote island, botanists found a fig species that relies on such a partnership, but after a thorough survey they found no trace of its pollinating wasp. It can most reasonably be concluded that ___",
        ),
      ],
      prompt: "Which choice most logically completes the text?",
      choices: [
        "the pollinating wasps are thriving on the island.",
        "fig trees on the island do not need to be pollinated to produce seeds.",
        "the wasps have begun reproducing inside other plants on the island.",
        "the figs on the island are not currently being pollinated by their usual wasp partner.",
      ],
      answer: "D",
      explanation:
        "If the fig relies on one wasp species and that wasp is absent from the island, the figs there cannot currently be pollinated by it. The text says the wasps reproduce only in that fig, which rules out C.",
    },
    // -----------------------------------------------------------------------
    // Standard English Conventions — Boundaries
    // -----------------------------------------------------------------------
    {
      id: "en-bnd-01",
      domain: SEC,
      skill: "Boundaries",
      difficulty: "easy",
      stimulus: [
        text(
          "The Atacama Desert in northern Chile is one of the driest places on ___ some of its weather stations have never recorded a single drop of rain.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["Earth, some", "Earth; some", "Earth some", "Earth, and, some"],
      answer: "B",
      explanation:
        "Both parts are independent clauses. A semicolon correctly joins them. A comma alone creates a comma splice, no punctuation creates a run-on, and \"and,\" with an extra comma is incorrect.",
    },
    {
      id: "en-bnd-02",
      domain: SEC,
      skill: "Boundaries",
      difficulty: "medium",
      stimulus: [
        text(
          "Astronomer Vera Rubin's measurements of how fast stars orbit the centers of galaxies provided some of the strongest early evidence for ___ invisible form of matter that does not emit light.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["dark matter, an", "dark matter. An", "dark matter; an", "dark matter an"],
      answer: "A",
      explanation:
        "\"An invisible form of matter...\" is an appositive that renames \"dark matter,\" so it should be set off with a comma. A period or semicolon would leave a fragment, and no punctuation fuses the appositive to the noun.",
    },
    {
      id: "en-bnd-03",
      domain: SEC,
      skill: "Boundaries",
      difficulty: "medium",
      stimulus: [
        text(
          "In 1903, Maggie L. Walker became the first woman in the United States to charter a bank. The bank, the St. Luke Penny Savings ___ served Richmond's Black community for decades.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["Bank; which", "Bank, which", "Bank which", "Bank. Which"],
      answer: "B",
      explanation:
        "The appositive \"the St. Luke Penny Savings Bank\" begins with a comma after \"The bank,\" so it must close with a comma too. A semicolon or period would break up the sentence, and without the comma the appositive isn't closed.",
    },
    {
      id: "en-bnd-04",
      domain: SEC,
      skill: "Boundaries",
      difficulty: "hard",
      stimulus: [
        text(
          "Coral reefs cover less than 1 percent of the ocean ___ they support roughly a quarter of all known marine species.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["floor yet", "floor yet,", "floor, yet,", "floor, yet"],
      answer: "D",
      explanation:
        "Two independent clauses joined by the coordinating conjunction \"yet\" need a comma before the conjunction and no comma after it.",
    },
    {
      id: "en-bnd-05",
      domain: SEC,
      skill: "Boundaries",
      difficulty: "hard",
      stimulus: [
        text(
          "The research team included three specialists: Amara Diallo, a marine ___ Kenji Ito, a statistician; and Sofia Reyes, a climate modeler.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["biologist,", "biologist", "biologist;", "biologist:"],
      answer: "C",
      explanation:
        "The list items already contain commas (\"Amara Diallo, a marine biologist\"), so the items must be separated by semicolons, matching the semicolon after \"statistician.\"",
    },
    {
      id: "en-bnd-06",
      domain: SEC,
      skill: "Boundaries",
      difficulty: "medium",
      stimulus: [
        text(
          "The Mars rover Perseverance carried a small ___ named Ingenuity—that in 2021 became the first aircraft to make a powered, controlled flight on another planet.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["helicopter,", "helicopter;", "helicopter", "helicopter—"],
      answer: "D",
      explanation:
        "The phrase \"named Ingenuity\" is a supplementary element closed by a dash, so it must open with a dash as well. Punctuation around an interrupting element must match.",
    },

    // -----------------------------------------------------------------------
    // Standard English Conventions — Form, Structure, and Sense
    // -----------------------------------------------------------------------
    {
      id: "en-fss-01",
      domain: SEC,
      skill: "Form, Structure, and Sense",
      difficulty: "easy",
      stimulus: [
        text(
          "The collection of antique maps in the museum's east wing ___ visitors from around the world each year.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["attract", "attracts", "are attracting", "have attracted"],
      answer: "B",
      explanation:
        "The subject is the singular noun \"collection\" (not \"maps\"), so it needs the singular verb \"attracts.\" \"Each year\" also calls for the simple present.",
    },
    {
      id: "en-fss-02",
      domain: SEC,
      skill: "Form, Structure, and Sense",
      difficulty: "medium",
      stimulus: [
        text(
          "After months of debate, the city council finally approved the new composting program. In a statement released the next morning, ___ announced that curbside collection would begin in March.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["they", "it", "them", "their"],
      answer: "B",
      explanation:
        "The pronoun refers to \"the city council,\" a singular collective noun, so the singular subject pronoun \"it\" is correct.",
    },
    {
      id: "en-fss-03",
      domain: SEC,
      skill: "Form, Structure, and Sense",
      difficulty: "medium",
      stimulus: [
        text(
          "By the time Tenzing Norgay and Edmund Hillary reached the summit of Mount Everest in 1953, other climbers ___ to reach it for more than thirty years.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["are trying", "will have tried", "had been trying", "try"],
      answer: "C",
      explanation:
        "The attempts were ongoing before a past event (1953), so the past perfect progressive \"had been trying\" is required.",
    },
    {
      id: "en-fss-04",
      domain: SEC,
      skill: "Form, Structure, and Sense",
      difficulty: "hard",
      stimulus: [
        text(
          "Having studied the migration of monarch butterflies for over a decade, ___",
        ),
      ],
      prompt: CONVENTIONS,
      choices: [
        "the monarchs' new route surprised Dr. Lin.",
        "Dr. Lin was surprised by a change in the monarchs' route.",
        "a change in the monarchs' route surprised Dr. Lin.",
        "the surprise for Dr. Lin was a change in the monarchs' route.",
      ],
      answer: "B",
      explanation:
        "The introductory phrase describes someone who studied monarchs, so the subject right after the comma must be that person: Dr. Lin. Otherwise the modifier dangles.",
    },
    {
      id: "en-fss-05",
      domain: SEC,
      skill: "Form, Structure, and Sense",
      difficulty: "medium",
      stimulus: [
        text(
          "Cliff swallows return to the same colony each spring. The ___ nests, built from pellets of mud, can cling to a cliff face for many years.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["birds", "bird's", "birds'", "birds's"],
      answer: "C",
      explanation:
        "The nests belong to many birds, so the plural possessive \"birds'\" is correct.",
    },
    {
      id: "en-fss-06",
      domain: SEC,
      skill: "Form, Structure, and Sense",
      difficulty: "hard",
      stimulus: [
        text(
          "Each of the paintings in the exhibition, which features artists from twelve countries, ___ a different interpretation of the theme of home.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["offer", "have offered", "offers", "are offering"],
      answer: "C",
      explanation:
        "The subject is \"Each,\" which is singular. Ignore the intervening phrase \"of the paintings...\" and choose the singular verb \"offers.\"",
    },

    {
      id: "en-fss-07",
      domain: SEC,
      skill: "Form, Structure, and Sense",
      difficulty: "medium",
      stimulus: [
        text(
          "Since it opened in 1897, the Library of Congress's Thomas Jefferson Building ___ millions of visitors with its elaborate murals, mosaics, and sculptures.",
        ),
      ],
      prompt: CONVENTIONS,
      choices: ["has impressed", "impress", "impressing", "will impress"],
      answer: "A",
      explanation:
        "\"Since it opened in 1897\" describes an action that began in the past and continues to the present, which calls for the present perfect \"has impressed.\" \"Impressing\" can't serve as the main verb.",
    },
    // -----------------------------------------------------------------------
    // Expression of Ideas — Transitions
    // -----------------------------------------------------------------------
    {
      id: "en-trn-01",
      domain: EOI,
      skill: "Transitions",
      difficulty: "easy",
      stimulus: [
        text(
          "Honeybees tell hive mates where to find food by performing a movement called the waggle dance. The angle of the dance indicates the food's direction relative to the sun. ___ the length of each waggle indicates how far away the food is.",
        ),
      ],
      prompt: TRANSITION,
      choices: ["However,", "Meanwhile,", "Instead,", "Additionally,"],
      answer: "D",
      explanation:
        "The final sentence adds a second piece of information the dance conveys (distance) to the first (direction), so \"Additionally\" fits. There is no contrast or substitution.",
    },
    {
      id: "en-trn-02",
      domain: EOI,
      skill: "Transitions",
      difficulty: "medium",
      stimulus: [
        text(
          "In the early 1900s, electric cars were quieter, cleaner, and easier to start than gasoline cars. ___ they were soon overtaken in popularity by gasoline cars, which could travel much farther before needing to refuel.",
        ),
      ],
      prompt: TRANSITION,
      choices: ["Nevertheless,", "Therefore,", "For example,", "Likewise,"],
      answer: "A",
      explanation:
        "Despite their advantages, electric cars lost out. \"Nevertheless\" signals this contrast with what came before.",
    },
    {
      id: "en-trn-03",
      domain: EOI,
      skill: "Transitions",
      difficulty: "medium",
      stimulus: [
        text(
          "Mangrove forests protect coastlines by absorbing the energy of incoming waves. ___ areas with healthy mangroves often suffer less damage during storms than areas where mangroves have been cleared.",
        ),
      ],
      prompt: TRANSITION,
      choices: ["In contrast,", "Nonetheless,", "As a result,", "Previously,"],
      answer: "C",
      explanation:
        "Less storm damage is a consequence of mangroves absorbing wave energy, so a cause-and-effect transition, \"As a result,\" is logical.",
    },
    {
      id: "en-trn-04",
      domain: EOI,
      skill: "Transitions",
      difficulty: "hard",
      stimulus: [
        text(
          "Well into the twentieth century, many astronomers believed that the Milky Way contained every star in the universe. In the 1920s, ___ Edwin Hubble showed that some faint, fuzzy patches in the night sky were entire galaxies lying far beyond our own.",
        ),
      ],
      prompt: TRANSITION,
      choices: ["however,", "for instance,", "similarly,", "in other words,"],
      answer: "A",
      explanation:
        "Hubble's discovery overturned the earlier belief, so a contrasting transition, \"however,\" is needed.",
    },
    {
      id: "en-trn-05",
      domain: EOI,
      skill: "Transitions",
      difficulty: "medium",
      stimulus: [
        text(
          "Tardigrades, tiny animals less than a millimeter long, can survive astonishing extremes. They have endured temperatures near absolute zero, intense radiation, and even the vacuum of space. ___ biologists study them to learn how living cells might be protected from damage.",
        ),
      ],
      prompt: TRANSITION,
      choices: ["Still,", "Instead,", "Consequently,", "By contrast,"],
      answer: "C",
      explanation:
        "Scientists study tardigrades because of their extraordinary resilience. The last sentence is a result of the previous ones, so \"Consequently\" fits.",
    },
    {
      id: "en-trn-06",
      domain: EOI,
      skill: "Transitions",
      difficulty: "hard",
      stimulus: [
        text(
          "The Great Pacific Garbage Patch is often imagined as a floating island of trash. ___ most of its debris consists of tiny plastic particles suspended below the surface, making the patch nearly invisible from the deck of a ship.",
        ),
      ],
      prompt: TRANSITION,
      choices: ["Moreover,", "In reality,", "Likewise,", "Thus,"],
      answer: "B",
      explanation:
        "The second sentence corrects the popular image described in the first, so \"In reality\" is the logical transition.",
    },

    {
      id: "en-trn-07",
      domain: EOI,
      skill: "Transitions",
      difficulty: "medium",
      stimulus: [
        text(
          "Many desert plants survive dry seasons by storing water in thick, fleshy leaves and stems. ___ others, such as the mesquite tree, send roots more than 50 meters underground to reach water deep below the surface.",
        ),
      ],
      prompt: TRANSITION,
      choices: ["Similarly,", "Therefore,", "In contrast,", "For instance,"],
      answer: "C",
      explanation:
        "The second sentence describes a different survival strategy (deep roots rather than water storage), so the contrasting transition \"In contrast\" fits.",
    },
    // -----------------------------------------------------------------------
    // Expression of Ideas — Rhetorical Synthesis
    // -----------------------------------------------------------------------
    {
      id: "en-rs-01",
      domain: EOI,
      skill: "Rhetorical Synthesis",
      difficulty: "medium",
      stimulus: [
        {
          type: "list",
          intro: NOTES,
          items: [
            "The axolotl is a salamander native to lakes near Mexico City.",
            "Unlike most salamanders, axolotls keep juvenile features, such as feathery external gills, throughout their lives.",
            "Axolotls can regrow lost limbs, parts of the spinal cord, and even parts of the heart.",
            "Scientists study axolotls to better understand how tissue regenerates.",
          ],
        },
      ],
      prompt:
        "The student wants to explain why scientists are interested in axolotls. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
      choices: [
        "The axolotl is a salamander native to lakes near Mexico City.",
        "Because axolotls can regrow limbs and even parts of the heart, scientists study them to learn how tissue regenerates.",
        "Axolotls keep feathery external gills throughout their lives.",
        "Unlike most salamanders, axolotls keep their juvenile features as adults.",
      ],
      answer: "B",
      explanation:
        "Only choice B connects the axolotl's regenerative ability to scientists' reason for studying it.",
    },
    {
      id: "en-rs-02",
      domain: EOI,
      skill: "Rhetorical Synthesis",
      difficulty: "hard",
      stimulus: [
        {
          type: "list",
          intro: NOTES,
          items: [
            "The Hubble Space Telescope launched in 1990.",
            "Hubble observes mainly visible and ultraviolet light.",
            "The James Webb Space Telescope launched in 2021.",
            "Webb observes mainly infrared light, which allows it to see through clouds of cosmic dust.",
          ],
        },
      ],
      prompt:
        "The student wants to emphasize a difference in the kind of light the two telescopes observe. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
      choices: [
        "While Hubble observes mainly visible and ultraviolet light, Webb observes mainly infrared light.",
        "Both Hubble and Webb are space telescopes launched by major space agencies.",
        "Webb, which launched in 2021, can see through clouds of cosmic dust.",
        "Hubble launched in 1990, more than thirty years before Webb.",
      ],
      answer: "A",
      explanation:
        "The goal is a contrast in the light each telescope observes. Choice A states both and contrasts them with \"While.\" Choice D gives a difference, but in launch dates rather than light.",
    },
    {
      id: "en-rs-03",
      domain: EOI,
      skill: "Rhetorical Synthesis",
      difficulty: "medium",
      stimulus: [
        {
          type: "list",
          intro: NOTES,
          items: [
            "Octavia E. Butler (1947–2006) was an American writer of science fiction.",
            "Her novel *Kindred* (1979) follows a Black woman who is pulled back in time to a plantation in early nineteenth-century Maryland.",
            "In 1995, Butler became the first science fiction writer to receive a MacArthur Fellowship.",
          ],
        },
      ],
      prompt:
        "The student wants to introduce Butler to an audience unfamiliar with her. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
      choices: [
        "In 1995, a writer received a MacArthur Fellowship.",
        "*Kindred* was published in 1979.",
        "Octavia E. Butler, an American science fiction writer, was the first writer in her genre to receive a MacArthur Fellowship.",
        "The novel *Kindred* is partly set in Maryland.",
      ],
      answer: "C",
      explanation:
        "An introduction should identify who Butler is and why she matters. Choice C names her, her genre, and a notable achievement. The other choices don't identify her for a new audience.",
    },
    {
      id: "en-rs-04",
      domain: EOI,
      skill: "Rhetorical Synthesis",
      difficulty: "hard",
      stimulus: [
        {
          type: "list",
          intro: NOTES,
          items: [
            "A study compared reading comprehension on paper and on screens.",
            "Participants read passages either in print or on a tablet.",
            "For longer texts, participants who read on paper scored higher on comprehension questions.",
            "For short texts, there was no significant difference between the two groups.",
          ],
        },
      ],
      prompt:
        "The student wants to present the study's findings about short texts. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
      choices: [
        "Participants in the study read passages either in print or on a tablet.",
        "Readers who used paper scored higher on questions about longer texts.",
        "The study compared reading comprehension on paper and on screens.",
        "For short texts, the study found no significant difference in comprehension between reading on paper and reading on a tablet.",
      ],
      answer: "D",
      explanation:
        "Only choice D reports the finding for short texts. Choice B is a finding, but about longer texts.",
    },
    {
      id: "en-rs-05",
      domain: EOI,
      skill: "Rhetorical Synthesis",
      difficulty: "medium",
      stimulus: [
        {
          type: "list",
          intro: NOTES,
          items: [
            "Kelp forests grow in cool, nutrient-rich coastal waters.",
            "Giant kelp can grow as much as 60 centimeters in a single day.",
            "Sea otters eat sea urchins, which feed on kelp.",
            "Where sea otters have disappeared, urchin populations have grown and kelp forests have declined.",
          ],
        },
      ],
      prompt:
        "The student wants to explain the role sea otters play in kelp forests. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
      choices: [
        "Giant kelp can grow as much as 60 centimeters in a single day.",
        "Kelp forests grow in cool, nutrient-rich coastal waters.",
        "By eating sea urchins, which feed on kelp, sea otters help keep kelp forests from declining.",
        "Sea urchins feed on kelp in coastal waters.",
      ],
      answer: "C",
      explanation:
        "Choice C explains the otters' role: they control urchins, which protects the kelp. The other choices don't mention otters.",
    },
    {
      id: "en-rs-06",
      domain: EOI,
      skill: "Rhetorical Synthesis",
      difficulty: "hard",
      stimulus: [
        {
          type: "list",
          intro: NOTES,
          items: [
            "Hedy Lamarr was a Hollywood film star in the 1930s and 1940s.",
            "During World War II, she co-invented a frequency-hopping system meant to keep enemies from jamming torpedo guidance signals.",
            "The U.S. Navy did not adopt the system during the war.",
            "Frequency-hopping principles are now used in technologies such as Wi-Fi and Bluetooth.",
          ],
        },
      ],
      prompt:
        "The student wants to emphasize the lasting significance of Lamarr's invention. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
      choices: [
        "Although the Navy did not adopt it during the war, Lamarr's frequency-hopping idea anticipated principles used today in Wi-Fi and Bluetooth.",
        "Hedy Lamarr starred in Hollywood films in the 1930s and 1940s.",
        "The U.S. Navy did not adopt Lamarr's system during World War II.",
        "Lamarr co-invented her frequency-hopping system during World War II.",
      ],
      answer: "A",
      explanation:
        "\"Lasting significance\" means impact beyond its time. Choice A links the invention to modern Wi-Fi and Bluetooth.",
    },
  ],
};
