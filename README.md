# Live Preview

[Link](https://htmlpreview.github.io/?https://github.com/drNenad/circular-slider/blob/master/index.html)



## Usage

```python
import CircularSlider from 'src/circularSlider.js';


const slides = [
    {
      color: '#77777',
      range: {
        min: 5,
        max: 10
      },
      step: 5,
      radius: 100,
      description: 'Test'
    },
];

const container = document.getElementById('Your slider div ');

return new CircularSlider(slides, container);
```
## Options

CircularSlider class constructor parameters:
| Name  | type |
| ------------- | ------------- |
| slides  | Array<Object>  |
| container  | HTMLElement  |

Slide object options:
| Name  | type |
| ------------- | ------------- |
| color  | String  |
| range  | Object  |
| step | Number  |
| radius  | Number  |
| description  | String  |
## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
