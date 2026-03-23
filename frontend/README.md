# SOC Shift Manager - Frontend

## Setup

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm start
```

Frontend will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
```

## Features

### Pages

1. **Home Dashboard**
   - Quick navigation to all features
   - Feature overview

2. **Analyst Management**
   - View all SOC analysts
   - Create new analysts
   - Edit analyst information (name, email, base hourly rate)
   - Delete analysts
   - Status management (active/inactive/on_leave)

3. **Shift Management**
   - Assign shifts to analysts
   - View all shifts with filtering
   - Filter by analyst and date range
   - Edit shift details
   - Delete shifts
   - Real-time pay calculation display

4. **Analytics & Reports**
   - Team summary statistics
   - Individual analyst summaries
   - Total hours worked
   - Total earnings with multipliers
   - Date range filtering

5. **Pay Rules Configuration**
   - View all pay multiplier rules
   - Create custom pay rules
   - Configure multipliers for specific days
   - Delete/deactivate rules
   - Pre-configured rules: Sunday (+75%), Saturday (+50%)

## Environment Variables

Create a `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── Home.jsx              # Dashboard & navigation
│   │   ├── AnalystManagement.jsx  # Analyst CRUD
│   │   ├── ShiftManagement.jsx    # Shift assignment & management
│   │   ├── Analytics.jsx          # Reports & analytics
│   │   └── PayRulesManagement.jsx # Pay multiplier configuration
│   ├── api.js                     # API client
│   ├── App.jsx                    # Main app component
│   ├── index.js                   # React entry point
│   ├── index.css                  # Global styles
│   └── index.jsx                  # Tailwind & base styles
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Styling

The application uses **Tailwind CSS** for styling with custom configuration.

### Common Classes Used
- `bg-white` - Card backgrounds
- `rounded-lg` - Border radius
- `shadow-md` - Shadows
- `border-l-4` - Left borders for cards
- `px-4 py-2` - Padding

## API Integration

The frontend communicates with the backend via REST API calls defined in `src/api.js`.

### API Client Structure
```javascript
analystAPI.getAll()           // GET /api/analysts
analystAPI.create(data)       // POST /api/analysts
analystAPI.update(id, data)   // PUT /api/analysts/{id}
shiftAPI.getAll(params)       // GET /api/shifts
analyticsAPI.getTeamSummary() // GET /api/analytics/team-summary
```

## Components

### Shared Patterns

**Form Handling**
- Form state in component using `useState`
- Toggle show/hide form with button
- Submit handler with API call
- Error handling with user feedback

**Data Loading**
- `loading` state with spinner
- Fetch on component mount with `useEffect`
- Error state with red alert box

**Filters**
- Filter inputs in container
- Apply button triggers new fetch
- Results update in real-time

## User Workflows

### Adding an Analyst
1. Go to Analysts page
2. Click "Add Analyst" button
3. Fill in form (Employee ID, Name, Email, Base Rate)
4. Click "Create"
5. Analyst appears in list

### Assigning a Shift
1. Go to Shifts page
2. Click "Assign Shift" button
3. Select analyst, date, start/end times
4. Optionally add notes
5. Click "Create"
6. Shift appears with calculated pay

### Viewing Analytics
1. Go to Analytics page
2. Choose Team Summary or Individual Analyst
3. (Optional) Select date range
4. Click "Update Report"
5. View summary statistics

## Development

### Hot Reload
During development, changes are automatically reflected in the browser.

### Debugging
- Use browser DevTools (F12)
- React DevTools extension recommended
- Check browser console for errors
- API calls visible in Network tab

### Adding New Pages
1. Create new component in `src/pages/`
2. Add route in `App.jsx`
3. Add navigation link in header

## Deployment

### Static Hosting (Netlify, Vercel)
```bash
npm run build
# Deploy build/ folder
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

**API Connection Error**
- Check backend is running on correct port
- Verify `REACT_APP_API_URL` in `.env`
- Check browser CORS errors in console

**Forms Not Submitting**
- Check all required fields filled
- Look for error message on form
- Check browser console for network errors

**Data Not Loading**
- Verify backend API is responding
- Check date format in filters
- Try refreshing page

## Future Enhancements

- [ ] User authentication
- [ ] CSV export for reports
- [ ] Batch shift import
- [ ] Email notifications
- [ ] Mobile app
- [ ] Calendar view
- [ ] Recurring shifts
- [ ] Shift swaps/requests
