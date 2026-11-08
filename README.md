# Course board

A weekly timetable for shopping [Cornell Tech](https://www.tech.cornell.edu/) classes without time conflicts. Check the courses you want, see overlaps on the week grid, and let the board pick a set that fits.

Live site: [small-visualizer.vercel.app](https://small-visualizer.vercel.app)

## Use it

The list starts with every Spring 2027 CS section on the Cornell Tech campus that has a published meeting time. Times and instructors come from the [Spring 2027 roster](https://classes.cornell.edu/search/roster/SP27?q=&days-type=any&campus%5B%5D=NYT&distrReqs-type=any&explStudies-type=any&pi=). Rooms are not published for these sections, so the location is Cornell Tech. CS 6412 also has a project section with no meeting time, and that section is left out.

- Check a class to put it on the week. The grid scrolls to that meeting.
- Overlapping selected classes are marked in the list and on the grid.
- **Require** keeps a class in the schedule. **Fit without overlaps** then builds the largest set that includes every required class.
- **Add class** is for anything not in the CS list. A name that starts with a subject code, such as `INFO 5305`, is grouped under that subject.
- **Show unselected** is off at first. Turn it on to see the classes you have not checked.
- Your list stays in this browser. Nothing is sent to a server.

## Run it locally

Node 18 or newer. The repo includes an `.nvmrc` for Node 22.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build
npm run preview
```
