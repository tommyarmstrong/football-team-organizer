# User Roles

These are the roles for the football organizer app.

1. Management
2. Coach
3. Guardian
4. Guardian assistant
5. Player
6. Admin

Every user in the system has one or more roles.

## Management

### Permissions

This is the owners and top-level managers of the club. For now, they have full read and write access to all data.

## Coach

### Permissions

Coaches have full read and write access to:

- Their own user profile
- Team data for every team they are assigned as coach
- Match data for every match their team plays

Coaches have full read (but not write) access to:

- Every team's data
- Every team's match data
- Every player's data (some field maybe restricted later)

### Attributes

## Guardian

### Permissions

Guardians have read and write access to:

- Their own user profile
- Their linked player's profile

Guardians have read (but not write) access to:

- Their linked player's team data
- Their linked player's team dashboard
- Their linked player's team's match data
- Their linked player's team's stats data

## Guardian assistant

### Permissions

Guardian assistants assist coaches. They have all the access of Guardians, and in addition, they have:

- Write access to match goal scorers
- Write access to match goal assists
- Write access to match scorers

## Player

Players have read (but not write) access to:

- Their own user profile
- Their own team data
- Their own team dashboard
- Their own team's match data
- Their own team's stats data

## Admin

This is the IT Admin for the site. They have full admin rights at this stage.
