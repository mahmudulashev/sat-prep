import { text, type SubjectBank } from "./schema.ts";

const ALG = "Algebra";
const ADV = "Advanced Math";
const PSD = "Problem-Solving and Data Analysis";
const GEO = "Geometry and Trigonometry";

const TRIANGLE_SVG = `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" font-family="'Noto Serif', Georgia, serif" font-size="16">
  <polygon points="30,170 270,170 120,35" fill="none" stroke="currentColor" stroke-width="2"/>
  <text x="52" y="162">50°</text>
  <text x="222" y="162">65°</text>
  <text x="112" y="68" font-style="italic">x°</text>
  <text x="14" y="188">A</text>
  <text x="276" y="188">B</text>
  <text x="114" y="26">C</text>
</svg>`;

export const math: SubjectBank = {
  subject: "math",
  questions: [
    // -----------------------------------------------------------------------
    // Algebra
    // -----------------------------------------------------------------------
    {
      id: "ma-alg-01",
      domain: ALG,
      skill: "Linear equations in one variable",
      difficulty: "easy",
      prompt: "If $3x + 7 = 22$, what is the value of $x$?",
      choices: ["$3$", "$5$", "$7$", "$15$"],
      answer: "B",
      explanation: "Subtract 7 from both sides: $3x = 15$. Divide by 3: $x = 5$.",
    },
    {
      id: "ma-alg-02",
      domain: ALG,
      skill: "Linear equations in one variable",
      difficulty: "easy",
      type: "spr",
      prompt: "If $4(x - 2) = 20$, what is the value of $x$?",
      value: 7,
      accepted: ["7"],
      explanation: "Divide both sides by 4: $x - 2 = 5$, so $x = 7$.",
    },
    {
      id: "ma-alg-03",
      domain: ALG,
      skill: "Linear functions",
      difficulty: "medium",
      prompt:
        "A gym charges a one-time membership fee of \\$40 plus \\$25 per month. Which equation gives the total cost $C$, in dollars, of a membership for $m$ months?",
      choices: ["$C = 40m + 25$", "$C = 25m + 40$", "$C = 65m$", "$C = 40 + \\dfrac{m}{25}$"],
      answer: "B",
      explanation:
        "The monthly charge grows with $m$, so it's $25m$. The one-time fee of 40 is added once: $C = 25m + 40$.",
    },
    {
      id: "ma-alg-04",
      domain: ALG,
      skill: "Systems of two linear equations",
      difficulty: "medium",
      stimulus: [text("$$2x + y = 11$$ $$x - y = 1$$")],
      prompt: "The solution to the given system of equations is $(x, y)$. What is the value of $x$?",
      choices: ["$3$", "$5$", "$4$", "$7$"],
      answer: "C",
      explanation: "Add the equations to eliminate $y$: $3x = 12$, so $x = 4$ (and $y = 3$).",
    },
    {
      id: "ma-alg-05",
      domain: ALG,
      skill: "Linear functions",
      difficulty: "medium",
      type: "spr",
      prompt: "A line in the $xy$-plane passes through the points $(1, 3)$ and $(4, 12)$. What is the slope of the line?",
      value: 3,
      accepted: ["3"],
      explanation: "Slope $= \\dfrac{12 - 3}{4 - 1} = \\dfrac{9}{3} = 3$.",
    },
    {
      id: "ma-alg-06",
      domain: ALG,
      skill: "Linear inequalities",
      difficulty: "medium",
      prompt: "Which inequality represents all values of $x$ for which $5 - 2x > 11$?",
      choices: ["$x > 3$", "$x < 3$", "$x > -3$", "$x < -3$"],
      answer: "D",
      explanation:
        "Subtract 5: $-2x > 6$. Dividing by $-2$ reverses the inequality: $x < -3$.",
    },
    {
      id: "ma-alg-07",
      domain: ALG,
      skill: "Systems of two linear equations",
      difficulty: "hard",
      type: "spr",
      stimulus: [text("$$3x + ky = 8$$ $$6x + 10y = 16$$")],
      prompt:
        "In the given system of equations, $k$ is a constant. If the system has infinitely many solutions, what is the value of $k$?",
      value: 5,
      accepted: ["5"],
      explanation:
        "Infinitely many solutions means the equations describe the same line. The second equation is 2 times the first ($6x$ and $16$), so $2k = 10$ and $k = 5$.",
    },
    {
      id: "ma-alg-08",
      domain: ALG,
      skill: "Systems of two linear equations",
      difficulty: "hard",
      stimulus: [text("$$y = 2x + 3$$ $$y = ax - 5$$")],
      prompt: "In the given system of equations, $a$ is a constant. If the system has no solution, what is the value of $a$?",
      choices: ["$-5$", "$-2$", "$2$", "$3$"],
      answer: "C",
      explanation:
        "A linear system has no solution when the lines are parallel and distinct: same slope, different intercepts. The slopes must both be 2, and the intercepts (3 and $-5$) already differ, so $a = 2$.",
    },
    {
      id: "ma-alg-09",
      domain: ALG,
      skill: "Systems of two linear equations",
      difficulty: "medium",
      prompt:
        "A school club bought 30 tickets to a play for a total of \\$288. Adult tickets cost \\$12 each and student tickets cost \\$8 each. How many adult tickets did the club buy?",
      choices: ["$12$", "$15$", "$18$", "$20$"],
      answer: "A",
      explanation:
        "Let $a$ be adult tickets and $s$ student tickets: $a + s = 30$ and $12a + 8s = 288$. Substitute $s = 30 - a$: $12a + 240 - 8a = 288$, so $4a = 48$ and $a = 12$.",
    },
    {
      id: "ma-alg-10",
      domain: ALG,
      skill: "Linear functions",
      difficulty: "hard",
      type: "spr",
      prompt: "For the linear function $f$, $f(2) = 7$ and $f(6) = 19$. What is the value of $f(10)$?",
      value: 31,
      accepted: ["31"],
      explanation:
        "The slope is $\\dfrac{19 - 7}{6 - 2} = 3$. From $x = 6$ to $x = 10$ the input increases by 4, so the output increases by 12: $f(10) = 19 + 12 = 31$.",
    },

    {
      id: "ma-alg-11",
      domain: ALG,
      skill: "Linear functions",
      difficulty: "medium",
      prompt:
        "The equation $y = 15x + 120$ gives the total amount $y$, in dollars, in Maya's savings account $x$ weeks after she started a savings plan. What is the best interpretation of $15$ in this context?",
      choices: [
        "Maya adds \\$15 to the account each week.",
        "Maya had \\$15 in the account when she started the plan.",
        "Maya will have \\$15 in the account after one week.",
        "Maya will save for 15 weeks.",
      ],
      answer: "A",
      explanation:
        "In $y = 15x + 120$, the coefficient of $x$ is the rate of change: each additional week adds 15 dollars. The constant 120 is the starting amount.",
    },
    // -----------------------------------------------------------------------
    // Advanced Math
    // -----------------------------------------------------------------------
    {
      id: "ma-adv-01",
      domain: ADV,
      skill: "Equivalent expressions",
      difficulty: "easy",
      prompt: "Which expression is equivalent to $(x + 3)(x - 5)$?",
      choices: ["$x^2 - 15$", "$x^2 + 2x - 15$", "$x^2 - 2x - 15$", "$x^2 - 8x - 15$"],
      answer: "C",
      explanation: "Expand: $x^2 - 5x + 3x - 15 = x^2 - 2x - 15$.",
    },
    {
      id: "ma-adv-02",
      domain: ADV,
      skill: "Nonlinear equations in one variable",
      difficulty: "medium",
      type: "spr",
      prompt: "What is the sum of the solutions to the equation $x^2 - 6x + 5 = 0$?",
      value: 6,
      accepted: ["6"],
      explanation: "Factor: $(x - 1)(x - 5) = 0$, so $x = 1$ or $x = 5$. Their sum is $6$.",
    },
    {
      id: "ma-adv-03",
      domain: ADV,
      skill: "Nonlinear functions",
      difficulty: "medium",
      prompt:
        "A population of 2,000 bacteria doubles every 3 hours. Which function gives the number of bacteria, $P(t)$, after $t$ hours?",
      choices: [
        "$P(t) = 2{,}000(2)^{t/3}$",
        "$P(t) = 2{,}000(2)^{3t}$",
        "$P(t) = 2{,}000(3)^{t/2}$",
        "$P(t) = 2{,}000 + 2\\left(\\dfrac{t}{3}\\right)$",
      ],
      answer: "A",
      explanation:
        "Doubling means a growth factor of 2, applied once every 3 hours, so the exponent is $\\dfrac{t}{3}$: $P(t) = 2{,}000(2)^{t/3}$.",
    },
    {
      id: "ma-adv-04",
      domain: ADV,
      skill: "Nonlinear functions",
      difficulty: "easy",
      prompt: "The function $f$ is defined by $f(x) = 3x^2 - 4$. What is the value of $f(-2)$?",
      choices: ["$-16$", "$-8$", "$8$", "$32$"],
      answer: "C",
      explanation: "$f(-2) = 3(-2)^2 - 4 = 3(4) - 4 = 8$.",
    },
    {
      id: "ma-adv-05",
      domain: ADV,
      skill: "Nonlinear equations in one variable",
      difficulty: "hard",
      type: "spr",
      prompt:
        "In the equation $x^2 + bx + 16 = 0$, $b$ is a positive constant. If the equation has exactly one real solution, what is the value of $b$?",
      value: 8,
      accepted: ["8"],
      explanation:
        "A quadratic has exactly one real solution when its discriminant is 0: $b^2 - 4(1)(16) = 0$, so $b^2 = 64$ and, since $b > 0$, $b = 8$.",
    },
    {
      id: "ma-adv-06",
      domain: ADV,
      skill: "Equivalent expressions",
      difficulty: "hard",
      prompt: "Which expression is equivalent to $\\dfrac{x^2 - 9}{x + 3}$ for $x \\neq -3$?",
      choices: ["$x + 3$", "$x - 3$", "$x - 9$", "$x^2 - 3$"],
      answer: "B",
      explanation:
        "Factor the numerator as a difference of squares: $\\dfrac{(x + 3)(x - 3)}{x + 3} = x - 3$.",
    },
    {
      id: "ma-adv-07",
      domain: ADV,
      skill: "Nonlinear functions",
      difficulty: "medium",
      prompt:
        "The value of a car, in dollars, $t$ years after it was purchased is modeled by $V(t) = 24{,}000(0.85)^t$. What is the best interpretation of $24{,}000$ in this context?",
      choices: [
        "The value of the car one year after it was purchased",
        "The amount by which the value decreases each year",
        "The value of the car when it was purchased",
        "The percent by which the value decreases each year",
      ],
      answer: "C",
      explanation:
        "When $t = 0$, $V(0) = 24{,}000(0.85)^0 = 24{,}000$, so it is the car's value at purchase.",
    },
    {
      id: "ma-adv-08",
      domain: ADV,
      skill: "Nonlinear functions",
      difficulty: "hard",
      prompt: "The function $g$ is defined by $g(x) = (x - 4)^2 + 3$. What is the minimum value of $g(x)$?",
      choices: ["$-4$", "$4$", "$7$", "$3$"],
      answer: "D",
      explanation:
        "The vertex form $a(x - h)^2 + k$ with $a > 0$ has minimum value $k$. Since $(x - 4)^2 \\ge 0$, the smallest value is $3$, reached at $x = 4$.",
    },
    {
      id: "ma-adv-09",
      domain: ADV,
      skill: "Nonlinear equations in one variable",
      difficulty: "medium",
      type: "spr",
      prompt: "If $2^{x + 1} = 32$, what is the value of $x$?",
      value: 4,
      accepted: ["4"],
      explanation: "$32 = 2^5$, so $x + 1 = 5$ and $x = 4$.",
    },
    {
      id: "ma-adv-10",
      domain: ADV,
      skill: "Nonlinear functions",
      difficulty: "hard",
      prompt: "How many times does the graph of $h(x) = x^3 - 4x$ intersect the $x$-axis?",
      choices: ["$0$", "$1$", "$2$", "$3$"],
      answer: "D",
      explanation:
        "Factor: $x^3 - 4x = x(x - 2)(x + 2)$. The zeros are $-2$, $0$, and $2$, so the graph crosses the $x$-axis 3 times.",
    },

    {
      id: "ma-adv-11",
      domain: ADV,
      skill: "Nonlinear functions",
      difficulty: "medium",
      type: "spr",
      prompt: "The function $f$ is defined by $f(x) = \\dfrac{x^2 + 6}{2}$. What is the value of $f(4)$?",
      value: 11,
      accepted: ["11"],
      explanation: "$f(4) = \\dfrac{4^2 + 6}{2} = \\dfrac{22}{2} = 11$.",
    },
    // -----------------------------------------------------------------------
    // Problem-Solving and Data Analysis
    // -----------------------------------------------------------------------
    {
      id: "ma-psd-01",
      domain: PSD,
      skill: "Ratios, rates, proportional relationships, and units",
      difficulty: "easy",
      prompt:
        "A recipe uses 3 cups of flour for every 2 cups of sugar. How many cups of flour are needed if 10 cups of sugar are used?",
      choices: ["$6$", "$13$", "$15$", "$20$"],
      answer: "C",
      explanation: "10 cups of sugar is 5 times 2 cups, so use $5 \\times 3 = 15$ cups of flour.",
    },
    {
      id: "ma-psd-02",
      domain: PSD,
      skill: "Percentages",
      difficulty: "easy",
      prompt: "A jacket originally priced at \\$80 is on sale for 25% off. What is the sale price of the jacket?",
      choices: ["\\$20", "\\$60", "\\$55", "\\$75"],
      answer: "B",
      explanation: "25% of 80 is 20, so the sale price is $80 - 20 = 60$ dollars.",
    },
    {
      id: "ma-psd-03",
      domain: PSD,
      skill: "Two-variable data: models and scatterplots",
      difficulty: "medium",
      stimulus: [
        text("The scatterplot shows the relationship between two variables, $x$ and $y$. A line of best fit for the data is also shown."),
        {
          type: "figure",
          figure: {
            kind: "scatter",
            xLabel: "x",
            yLabel: "y",
            x: [0, 10, 1],
            y: [0, 14, 2],
            points: [
              [1, 2.5],
              [2, 4.6],
              [3, 4.8],
              [4, 6.6],
              [5, 6.3],
              [6, 8.7],
              [7, 8.8],
              [8, 10.4],
              [9, 11.3],
              [10, 11.5],
            ],
            line: [
              [0, 2],
              [10, 12],
            ],
          },
        },
      ],
      prompt: "At $x = 8$, which of the following is closest to the $y$-value predicted by the line of best fit?",
      choices: ["$8$", "$9$", "$10$", "$12$"],
      answer: "C",
      explanation:
        "The line passes through $(0, 2)$ and $(10, 12)$, so its equation is $y = x + 2$. At $x = 8$, the predicted value is $10$.",
    },
    {
      id: "ma-psd-04",
      domain: PSD,
      skill: "One-variable data: distributions and measures of center",
      difficulty: "medium",
      type: "spr",
      prompt: "The mean of five numbers is 12. Four of the numbers are 8, 10, 14, and 15. What is the fifth number?",
      value: 13,
      accepted: ["13"],
      explanation: "The five numbers sum to $5 \\times 12 = 60$. The four known numbers sum to 47, so the fifth is $60 - 47 = 13$.",
    },
    {
      id: "ma-psd-05",
      domain: PSD,
      skill: "One-variable data: distributions and measures of center",
      difficulty: "medium",
      prompt: "What is the median of the data set $3, 7, 7, 9, 12, 15$?",
      choices: ["$7$", "$8$", "$8.5$", "$9$"],
      answer: "B",
      explanation: "With six values, the median is the mean of the 3rd and 4th values: $\\dfrac{7 + 9}{2} = 8$.",
    },
    {
      id: "ma-psd-06",
      domain: PSD,
      skill: "Probability and conditional probability",
      difficulty: "hard",
      stimulus: [
        {
          type: "table",
          title: "Club Membership by Grade",
          headers: ["", "Robotics", "Drama", "Total"],
          rows: [
            ["Grade 10", "18", "12", "30"],
            ["Grade 11", "14", "16", "30"],
            ["Total", "32", "28", "60"],
          ],
        },
      ],
      prompt:
        "The table shows the number of students in two clubs, by grade. Each student is in exactly one club. If a student is selected at random from the drama club, what is the probability that the student is in grade 11?",
      choices: ["$\\dfrac{4}{15}$", "$\\dfrac{8}{15}$", "$\\dfrac{4}{7}$", "$\\dfrac{7}{15}$"],
      answer: "C",
      explanation:
        "Restrict to the drama club: 28 students, 16 of whom are in grade 11. The probability is $\\dfrac{16}{28} = \\dfrac{4}{7}$.",
    },
    {
      id: "ma-psd-07",
      domain: PSD,
      skill: "Percentages",
      difficulty: "medium",
      type: "spr",
      prompt: "The price of a book increased from \\$50 to \\$65. By what percent did the price increase?",
      value: 30,
      accepted: ["30"],
      explanation: "The increase is 15, and $\\dfrac{15}{50} = 0.30$, or 30%. Enter 30 (without the percent sign).",
    },
    {
      id: "ma-psd-08",
      domain: PSD,
      skill: "Ratios, rates, proportional relationships, and units",
      difficulty: "hard",
      type: "spr",
      prompt: "A train travels at a constant speed of 72 kilometers per hour. What is this speed in meters per second?",
      value: 20,
      accepted: ["20"],
      explanation:
        "$72 \\text{ km/h} = \\dfrac{72{,}000 \\text{ m}}{3{,}600 \\text{ s}} = 20$ meters per second.",
    },
    {
      id: "ma-psd-09",
      domain: PSD,
      skill: "Two-variable data: models and scatterplots",
      difficulty: "medium",
      stimulus: [
        text("The line graph shows the temperature in a city, in degrees Celsius, recorded every two hours from 6:00 a.m. to 6:00 p.m."),
        {
          type: "figure",
          figure: {
            kind: "line",
            xLabel: "Hour of the day",
            yLabel: "Temperature (°C)",
            x: [6, 18, 2],
            y: [10, 26, 2],
            points: [
              [6, 12],
              [8, 14],
              [10, 19],
              [12, 22],
              [14, 23],
              [16, 21],
              [18, 17],
            ],
          },
        },
      ],
      prompt: "During which two-hour interval did the temperature increase the most?",
      choices: ["6:00 a.m. to 8:00 a.m.", "8:00 a.m. to 10:00 a.m.", "10:00 a.m. to 12:00 p.m.", "12:00 p.m. to 2:00 p.m."],
      answer: "B",
      explanation:
        "The increases are 2°, 5°, 3°, and 1° for the four intervals. The largest, 5°, occurs from 8:00 to 10:00 a.m.",
    },
    {
      id: "ma-psd-10",
      domain: PSD,
      skill: "Inference from sample statistics",
      difficulty: "hard",
      prompt:
        "A town has 12,000 residents. In a random sample of 200 residents, 46 said they prefer a proposed park design. Based on the sample, which is the best estimate of the number of residents who prefer the design?",
      choices: ["$230$", "$2{,}760$", "$460$", "$5{,}520$"],
      answer: "B",
      explanation: "The sample proportion is $\\dfrac{46}{200} = 0.23$. Applied to the town: $0.23 \\times 12{,}000 = 2{,}760$.",
    },

    {
      id: "ma-psd-11",
      domain: PSD,
      skill: "Percentages",
      difficulty: "easy",
      prompt: "In a survey of 250 students, 40% said they walk to school. How many of the students surveyed said they walk to school?",
      choices: ["$40$", "$60$", "$100$", "$150$"],
      answer: "C",
      explanation: "$0.40 \\times 250 = 100$.",
    },
    // -----------------------------------------------------------------------
    // Geometry and Trigonometry
    // -----------------------------------------------------------------------
    {
      id: "ma-geo-01",
      domain: GEO,
      skill: "Right triangles and trigonometry",
      difficulty: "easy",
      prompt: "A rectangle has a length of 12 and a width of 5. What is the length of a diagonal of the rectangle?",
      choices: ["$7$", "$13$", "$17$", "$60$"],
      answer: "B",
      explanation: "The diagonal is the hypotenuse of a right triangle with legs 12 and 5: $\\sqrt{12^2 + 5^2} = \\sqrt{169} = 13$.",
    },
    {
      id: "ma-geo-02",
      domain: GEO,
      skill: "Lines, angles, and triangles",
      difficulty: "easy",
      prompt:
        "A person who is 6 feet tall casts a shadow 4 feet long. At the same time, a nearby flagpole casts a shadow 14 feet long. How tall, in feet, is the flagpole?",
      choices: ["$9$", "$16$", "$21$", "$24$"],
      answer: "C",
      explanation:
        "The triangles formed are similar, so heights and shadows are proportional: $\\dfrac{6}{4} = \\dfrac{h}{14}$, which gives $h = 21$.",
    },
    {
      id: "ma-geo-03",
      domain: GEO,
      skill: "Lines, angles, and triangles",
      difficulty: "medium",
      type: "spr",
      stimulus: [
        {
          type: "figure",
          figure: { kind: "svg", svg: TRIANGLE_SVG, width: 300, height: 200 },
          caption: "Note: Figure not drawn to scale.",
        },
      ],
      prompt: "In triangle $ABC$ shown, what is the value of $x$?",
      value: 65,
      accepted: ["65"],
      explanation: "The angles of a triangle sum to 180°: $x = 180 - 50 - 65 = 65$.",
    },
    {
      id: "ma-geo-04",
      domain: GEO,
      skill: "Circles",
      difficulty: "medium",
      prompt: "A circle has a circumference of $10\\pi$. What is the area of the circle?",
      choices: ["$5\\pi$", "$10\\pi$", "$25\\pi$", "$100\\pi$"],
      answer: "C",
      explanation: "$C = 2\\pi r = 10\\pi$ gives $r = 5$, so the area is $\\pi r^2 = 25\\pi$.",
    },
    {
      id: "ma-geo-05",
      domain: GEO,
      skill: "Lines, angles, and triangles",
      difficulty: "medium",
      type: "spr",
      prompt:
        "Two parallel lines are intersected by a transversal. One of the angles formed measures 118°. What is the measure, in degrees, of each acute angle formed?",
      value: 62,
      accepted: ["62"],
      explanation:
        "Every angle formed is either congruent or supplementary to the 118° angle. The acute angles measure $180 - 118 = 62$ degrees.",
    },
    {
      id: "ma-geo-06",
      domain: GEO,
      skill: "Right triangles and trigonometry",
      difficulty: "hard",
      prompt: "In right triangle $ABC$, angle $C$ is the right angle and $\\sin A = \\dfrac{5}{13}$. What is the value of $\\cos B$?",
      choices: ["$\\dfrac{5}{13}$", "$\\dfrac{12}{13}$", "$\\dfrac{13}{5}$", "$\\dfrac{5}{12}$"],
      answer: "A",
      explanation:
        "Angles $A$ and $B$ are complementary, and the sine of an angle equals the cosine of its complement, so $\\cos B = \\sin A = \\dfrac{5}{13}$.",
    },
    {
      id: "ma-geo-07",
      domain: GEO,
      skill: "Circles",
      difficulty: "hard",
      type: "spr",
      prompt: "The equation $x^2 + y^2 - 6x + 4y - 12 = 0$ defines a circle in the $xy$-plane. What is the radius of the circle?",
      value: 5,
      accepted: ["5"],
      explanation:
        "Complete the square: $(x - 3)^2 + (y + 2)^2 = 12 + 9 + 4 = 25$. The radius is $\\sqrt{25} = 5$.",
    },
    {
      id: "ma-geo-08",
      domain: GEO,
      skill: "Area and volume",
      difficulty: "medium",
      prompt: "A right circular cylinder has a radius of 3 and a height of 8. What is the volume of the cylinder?",
      choices: ["$24\\pi$", "$72\\pi$", "$48\\pi$", "$144\\pi$"],
      answer: "B",
      explanation: "$V = \\pi r^2 h = \\pi(3)^2(8) = 72\\pi$.",
    },
    {
      id: "ma-geo-09",
      domain: GEO,
      skill: "Circles",
      difficulty: "hard",
      prompt:
        "A circle has a radius of 9. A central angle of the circle measures $\\dfrac{2\\pi}{3}$ radians. What is the length of the arc intercepted by the angle?",
      choices: ["$3\\pi$", "$9\\pi$", "$12\\pi$", "$6\\pi$"],
      answer: "D",
      explanation: "Arc length $= r\\theta = 9 \\cdot \\dfrac{2\\pi}{3} = 6\\pi$.",
    },
    {
      id: "ma-geo-10",
      domain: GEO,
      skill: "Right triangles and trigonometry",
      difficulty: "medium",
      type: "spr",
      prompt: "The hypotenuse of a $45^\\circ$-$45^\\circ$-$90^\\circ$ triangle has length $8\\sqrt{2}$. What is the length of one leg of the triangle?",
      value: 8,
      accepted: ["8"],
      explanation: "In a 45-45-90 triangle, the hypotenuse is $s\\sqrt{2}$, where $s$ is a leg. So $s = 8$.",
    },
    {
      id: "ma-geo-11",
      domain: GEO,
      skill: "Area and volume",
      difficulty: "hard",
      type: "spr",
      prompt: "A square is inscribed in a circle with a radius of 5. What is the area of the square?",
      value: 50,
      accepted: ["50"],
      explanation:
        "The diagonal of the inscribed square is a diameter of the circle, 10. A square with diagonal $d$ has area $\\dfrac{d^2}{2} = \\dfrac{100}{2} = 50$.",
    },
  ],
};
