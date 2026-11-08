import { COLORS } from "./logic";
import type { Course, Meeting } from "./types";

function course(id: string, name: string, teacher: string, meetings: Meeting[]): Course {
  return { id, name, teacher, place: "Cornell Tech", color: COLORS[0], meetings, selected: false, pinned: false };
}

// Every timed Spring 2027 CS section on the Cornell Tech campus.
// CS 6412 also has a project section with no published meeting time, so it is not listed.
// https://classes.cornell.edu/search/roster/SP27?q=&days-type=any&campus[]=NYT
export function createSample(): Course[] {
  const courses = [
    course("cs-5304-030", "CS 5304 · Data Science in the Wild", "Joerg Blumtritt", [
      { day: 0, start: 700, end: 775 },
      { day: 2, start: 700, end: 775 },
    ]),
    course("cs-5382-030", "CS 5382 · Fairness in Machine Learning", "Angelina Wang", [
      { day: 0, start: 805, end: 880 },
      { day: 2, start: 805, end: 880 },
    ]),
    course("cs-5433-030", "CS 5433 · Blockchains, Cryptocurrencies, and Smart Contracts", "Ari Juels", [
      { day: 0, start: 1075, end: 1150 },
      { day: 2, start: 1075, end: 1150 },
    ]),
    course("cs-5436-030", "CS 5436 · Privacy in the Digital Age", "Vitaly Shmatikov", [
      { day: 0, start: 805, end: 880 },
      { day: 2, start: 805, end: 880 },
    ]),
    course("cs-5670-030", "CS 5670 · Introduction to Computer Vision", "Noah Snavely", [
      { day: 1, start: 520, end: 595 },
      { day: 3, start: 520, end: 595 },
    ]),
    course("cs-5726-030", "CS 5726 · Applied Causal Inference using Machine Learning", "Nathan Kallus", [
      { day: 0, start: 610, end: 685 },
      { day: 2, start: 610, end: 685 },
    ]),
    course("cs-5744-030", "CS 5744 · Language Modeling", "Yoav Artzi", [
      { day: 0, start: 895, end: 970 },
      { day: 2, start: 895, end: 970 },
    ]),
    course("cs-5755-030", "CS 5755 · Robots in the Wild", "Wendy Ju", [
      { day: 0, start: 805, end: 880 },
      { day: 2, start: 805, end: 880 },
    ]),
    course("cs-5775-030", "CS 5775 · Machine Learning Hardware and Systems", "Mohamed Abdelfattah", [
      { day: 0, start: 520, end: 595 },
      { day: 2, start: 520, end: 595 },
    ]),
    course("cs-5788-030", "CS 5788 · Introduction to Generative Models", "Andrew Owens", [
      { day: 1, start: 610, end: 685 },
      { day: 3, start: 610, end: 685 },
    ]),
    course("cs-6412-030", "CS 6412 · Advanced Topics in Operating Systems", "Alex Conway", [
      { day: 0, start: 610, end: 685 },
      { day: 2, start: 610, end: 685 },
    ]),
    course("cs-6674-030", "CS 6674 · Multimodal Computer Vision", "Hadar Elor", [
      { day: 3, start: 610, end: 775 },
    ]),
    course("cs-6816-030", "CS 6816 · Meta-Complexity and Cryptography", "Rafael Pass", [
      { day: 0, start: 570, end: 750 },
      { day: 2, start: 570, end: 750 },
    ]),
    course("cs-7794-130", "CS 7794 · Seminar in Natural Language Understanding", "Yoav Artzi, Claire Cardie", [
      { day: 4, start: 805, end: 855 },
    ]),
  ];
  return courses.map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));
}
