# THE ARTificial PARTY PACK

The ARTificial Party Pack is a collection of party games infused with the power of the world renound language model, GPT!

## Games

### Not Like The Others (I'll start with this one)

Step into a world of deception and deduction with 'Not Like The Others', the game that challenges you to spot an imposter among a sea of players through analysis and shrewd observation!

---

### GPT Trivia

Welcome to GPT Trivia! Our game uses GPT's state-of-the-art machine learning technology to constantly generate new and reliable questions, so you'll never run out of challenging and exciting trivia to test your knowledge. Compete against your friends and family to see who can get the highest score!

---

### Wit Spit

Wit Spit is a game of wit and speed where players must come up with the most creative and hilarious responses to a given prompt. The player with the most upvotes becomes the Wit Spit Champion!

---

### Definitionary

Definitionary is the ultimate word game where players are challenged to come up with the most convincing definition for a random word. Players then pick which definition they think is the most accurate and bonus points are awarded to those that pick the actual definition! The player with the most votes wins!

---
### Key features

- Secure login over HTTPS
- The user can join a multiplayer game with a room code
- Use GPT to generate questions
- Prompt the user for a response to a question
- Display responses from other users
- Users vote on other user's respsonses
- Results are persistently stored

---

### Technologies

I am going to use the required technologies in the following ways.

- **HTML** - Uses correct HTML structure for application. Two HTML pages. One for login and one for response/voting.
- **CSS** - Application styling that looks good on different screen sizes, uses good whitespace, color choice and contrast.
- **JavaScript** - Provides login, response display, applying votes, display score board, backend endpoint calls.
- **Service** - Backend service with endpoints for:
  - login
  - retrieving responses
  - submitting votes
  - retrieving vote status
- **DB** - Store users, responses, votes, and score in database.
- **Login** - Register and login users. Credentials securely stored in database. Cant join game without login
- **WebSocket** - As each user votes, their votes are broadcast to all other users.
- **React** - Application ported to use the React web framework.

---

## HTML deliverable

For this deliverable I added the application structure.

- **HTML pages** - 14 HTML pages that represent the ability to join a game, choose a game to host, respond to a prompt, vote, display the scoreboard,login, and create an account.
- **Links** - Game Selection -> Waiting Room -> Game Instruction -> Response -> Voting -> Display Score -> Response or index
- **Text** - All of the questions are represented as textual elements. The about section hosts a lot of text as well.
- **Images** - Logo in the top left of the page. For each of the games there is an associated crown icon.
- **Login** - Input box and submit button for login. Also option to create an account.
- **Database** - The voting choices represent data pulled from the database. Questions are pulled from a database.
- **WebSocket** - The count of voting results represent the tally of realtime votes.

## CSS deliverable

For this deliverable I properly styled the application into its final appearance.

- Header, footer, and main content body
- **Navigation elements** - I removed text decoration
- **Responsive to window resizing** - My app looks great on all window sizes and devices. 
- **Application elements** - Used good contrast and whitespace
- **Application text content** - Consistent font size and color
- **Application images** - I added two icons and a profile photo

---

## Design Images

### Workflow
![Workflow](images/gpt-party-pack-2.png)

### Game Screenshots
![Home](images/gpt-party-pack-3.png)

![GPT Trivia](images/gpt-party-pack-4.png)

![Not Like The Others](images/gpt-party-pack-5.png)

![Wit Spit](images/gpt-party-pack-6.png)

