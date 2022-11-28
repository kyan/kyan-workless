# Workless

An API that merges Forecast and Timetastic data and currently gives a basic
output:

```json
{
  "date": "2022-10-14",
  "users": [
    {
      "workless": false,
      "timetastic_id": 12345,
      "email": "foo@bar.com",
      "first_name": "Foo",
      "last_name": "Bar",
      "absence": {
        "date": "2022-11-28",
        "userId": 54321,
        "startType": "Morning",
        "endType": "Afternoon",
        "reason": "",
        "status": "Approved",
        "leaveType": "Working in Office"
      }
    }
  ]
}
```

Which can be used to show who doesn't appear to have anything assigned that day.

Params `date` - e.g `2022-11-01`. Default to today.

# usage

Run locally with `deno task dev`

# deployment

This is a perfect project to run on https://deno.com/deploy.
