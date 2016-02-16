
$(document).ready(function () {
    var Slider = function () {
        var sliderElement = $('[data-presentation-slider]');
        var slideName =  $('[data-slide-name]');
        var container =  $('[data-slide]');

        var touch = {
            move  : {},
            start : {},
            delta : {},
            isScrolling : undefined,
            position : 0
        };


        return {
            baseElement: sliderElement,
            updateTime: parseInt(sliderElement.attr('data-presentation-slider')),
            updateInterval: undefined,
            container: container,
            slideName: slideName,
            currentSlide: 0,

            support: (function () {
                return {
                    touch: window.ontouchstart !== undefined || (window.DocumentTouch && document instanceof DocumentTouch)
                }
            })(),

            slidesOptions: [],

            sliderTransition: 'transform 1s ease-in-out',
            slideNameTransition: 'transform 1s linear',

            getNavigation: function (f) {
                var navElements = this.baseElement.find('[data-slide-navigation]').children(), filtered = [];

                if(typeof f == 'function') {
                    $.each(navElements, function (i, v) {
                        f(v, i);
                        if(f(v, i)) {
                            filtered.push(v);
                        }
                    });
                }

                return (filtered.length !== 0) ? filtered : navElements;
            },
            getSlides: function (f) {
                var slides = this.baseElement.find('[data-slide]'), filtered = [];

                if(typeof f == 'function') {
                    $.each(slides, function (i, slide) {
                        if(f(slide, i)) {
                            filtered.push(slide);
                        }
                    });
                }

                return (filtered.length !== 0) ? filtered : slides;
            },
            getActive: function () {
                var self = this,
                    slide = $(self.getSlides(function (slide) { return $(slide).hasClass('active') })[0]),
                    nav = $(self.getNavigation(function (nav) { return $(nav).hasClass('active') })[0]);
                return {
                    slide: { element: slide, index: slide.index() },
                    nav: { element: nav, index: nav.index() },
                }
            },
            setActive: function (index) {

                var self = this, prevActiveSlide = {}, newActiveSlide = {};

                var slides = this.getSlides(function (slide) {
                    slide = $(slide);

                    if(slide.hasClass('active')) {
                        prevActiveSlide = slide.addClass('active-leave');
                    }

                    //slide.removeClass('active');
                });

                newActiveSlide = slides.eq(index).addClass('active active-enter');

                setTimeout(function () {
                    prevActiveSlide.removeClass('active active-leave');
                    newActiveSlide.removeClass('active-enter');
                }, 1000);

                this.getNavigation(function (nav) {
                    $(nav).removeClass('active')
                }).eq(index).addClass('active');

            },
            navigationHandler: function () {
                var self = this;
                return this.getNavigation(function (nav) {
                    $(nav).on('click', function () {
                        if(self.updateInterval)
                            clearInterval(self.updateInterval);
                        self.setActive($(this).index());
                    });
                });
            },
            getSlide: function (currentSlide) {

                currentSlide = currentSlide || $(this.container).last();
                var self = this;
                return {
                    next: function (css) {
                        var next = $(currentSlide).next().length == 0 ? $(self.container).first() : $(currentSlide).next();

                        if(css !== undefined) {
                            $(next).css(css);
                        }

                        return { element: next, index: $(self.container).index(next) };
                    },
                    prev: function (css) {
                        var prev = $(currentSlide).prev().length == 0 ? $(self.container).last() : $(currentSlide).prev();

                        if(css !== undefined)
                            $(prev).css(css);

                        return { element: prev, index: $(self.container).index(prev) };
                    }
                }
            },
            toggleTransition: function (transition, element) {
                var self = this;
                if(transition) {
                    $(element || this.container).css({'transition': self.sliderTransition});
                } else {
                    $(element || this.container).css({'transition': 'none'});
                }

                return this;
            },
            toggleChildTransition: function (transition, children) {
                var self = this;

                if(transition) {
                    $(this.container).children(children).css({'transition': transition});
                } else {
                    $(this.container).children(children).css({'transition': 'none'});
                }

                return this;
            },
            translateChildren: function (target, selector, css) {
                $(target).children(selector).css(css);

                return this;
            },
            translate: function (target, deltaX, transition) {
                var self = this;

                this.toggleTransition(transition)
                    .toggleChildTransition((transition) ? self.slideNameTransition : undefined, '.slide-name');

                $(target).css({'transform': 'translate(' + deltaX + 'px, 0)'});

                var next = this.getSlide(target).next({'transform': 'translate('+(self.container.width() + deltaX)+'px, 0)'}),
                    prev = this.getSlide(target).prev({'transform': 'translate('+(-1*self.container.width() + deltaX)+'px, 0)'});

                this.translateChildren(target, '.slide-name',
                    {
                        /*'margin-left': deltaX + 'px',
                        'margin-bottom': (deltaX*0.25)+ 'px'*/
                        'transform': 'rotate(-7.5deg) translate('+(deltaX)+'px, '+(deltaX*-0.1316)+'px)'
                    }
                ).translateChildren(next.element, '.slide-name',
                    {
                        /*'margin-left': Math.floor((deltaX + self.container.width())*0.25)+ 'px',
                        'margin-bottom': Math.floor((deltaX + self.container.width())*0.15) + 'px'*/
                        'transform': 'rotate(-7.5deg) translate('+(deltaX + self.container.width())+'px, '+((deltaX + self.container.width())*-0.1316)+'px)'
                    }
                ).translateChildren(prev.element, '.slide-name',
                    {
                        /*'margin-left': Math.floor((deltaX - self.container.width())*0.25)+ 'px',
                        'margin-bottom': Math.floor((deltaX - self.container.width())*0.15) + 'px'*/
                        'transform': 'rotate(-7.5deg) translate('+(deltaX - self.container.width())+'px, '+((deltaX - self.container.width())*-0.1316)+'px)'
                    }
                );

            },
            touchstart : function (event) {

                clearInterval(Slider.updateInterval);

                var touches = (event.originalEvent || event).touches[0];
                touch.delta = {};
                touch.start = {
                    x: touches.pageX,
                    y: touches.pageY,
                    time: Date.now()
                };
            },
            touchmove : function (event) {
                var touches = (event.originalEvent || event).touches[0];
                touch.delta = {
                    x: touches.pageX - touch.start.x,
                    y: touches.pageY - touch.start.y
                };

                var deltaX = touch.delta.x, direction = deltaX < 0 ? -1 : 1;

                if(touch.isScrolling === undefined) {
                    touch.isScrolling = touch.isScrolling || Math.abs(deltaX) < Math.abs(touch.delta.y)
                }

                if(!touch.isScrolling) {
                    this.translate($(Slider.container).eq(Slider.currentSlide), deltaX);
                }
            },
            touchend : function (event) {
                var isShortDuration = Number(Date.now() - touch.start.time) < 250,
                    slideWidth      = Slider.container.width(),
                    isNextCard      = (isShortDuration && Math.abs(touch.delta.x) > 20) || Math.abs(touch.delta.x) > slideWidth / 2,
                    direction       = touch.delta.x < 0 ? -1 : 1,
                    directionName   = (direction < 0) ? 'next' : 'prev';

                if(!isNextCard) {
                    Slider.translate($(Slider.container).eq(Slider.currentSlide), 0, true);
                } else {
                    Slider.setPositions(Slider.getSlide($(Slider.container).eq(Slider.currentSlide))[directionName]().index, true, direction)
                          .changeCurrent(-1*direction);
                }
            },
            changeCurrent: function (direction) {
                if(direction > 0) {
                    if (this.currentSlide + 1 == $(this.container).length) this.currentSlide = 0;
                    else this.currentSlide += direction;
                } else if (direction < 0) {
                    if(this.currentSlide - 1 < 0) this.currentSlide = $(this.container).length - 1;
                    else this.currentSlide += direction;
                }

                console.log('this.currentSlide', this.currentSlide);

                return this;
            },
            checkExtremeSlides: function (index, futureTranslate, slide) {
                if(this.slidesOptions[index]) {
                    if((this.slidesOptions[index].x_pos < 0 && futureTranslate > 0) || (this.slidesOptions[index].x_pos > 0 && futureTranslate < 0)) {
                        $(slide).css({'transition': 'none'});
                        $(slide).children('.slide-name').css({'transition': 'none'});
                    }
                }
            },
            setPositions: function (setIndex, transition, direction) {
                setIndex = setIndex || 0;

                var self = this, contWidth = self.container.width();

                var options = [];

                self.toggleTransition(transition)
                    .toggleChildTransition((transition) ? self.slideNameTransition : undefined, '.slide-name');


                $.each(this.container, function (index, slide) {

                    var prev    = ((index + 1) > self.container.length - 1) ? 0 : index + 1;
                    var next    = ((index - 1) < 0) ? self.container.length - 1 : index - 1;

                    if (setIndex == index) {
                        self.checkExtremeSlides(index, 0, slide);
                        $(slide).css({'transform': 'translate(0,0)'});

                        self.translateChildren(slide, '.slide-name',
                            {
                                /*'margin-left': '0px',*/
                                'transform': 'rotate(-7.5deg) translate(0,0)'
                            }
                        );

                        options.push({x_pos: 0, index: index});
                    } else if(setIndex == next) {
                        self.checkExtremeSlides(index, contWidth, slide);
                        $(slide).css({'transform': 'translate('+contWidth+'px,0)'});

                        self.translateChildren(slide, '.slide-name',
                            {
                                'transform': 'rotate(-7.5deg) translate(100%, -70%)'
                            }
                        );

                        options.push({x_pos: contWidth, index: index});

                    } else if(setIndex == prev) {
                        self.checkExtremeSlides(index, -1*contWidth, slide);
                        $(slide).css({'transform': 'translate('+(-1*contWidth)+'px,0)'});

                        self.translateChildren(slide, '.slide-name',
                            {
                                'transform': 'rotate(-7.5deg) translate(-100%, 100%)'
                            }
                        );

                        options.push({x_pos: (-1*contWidth), index: index});
                    } else {
                        self.checkExtremeSlides(index, contWidth, slide);
                        $(slide).css({'transform': 'translate('+contWidth+'px,0)'});

                        self.translateChildren(slide, '.slide-name',
                            {
                                'transform': 'rotate(-7.5deg) translate(100%, -100%)'
                            }
                        );

                        options.push({x_pos: contWidth, index: index});
                    }

                    $(slide).css({'left': (-1 * index * $(slide).width())+'px', 'width': self.container.width()+'px'});
                });

                this.slidesOptions = options;

                return this;
            },
            proxyListener: function (event) {
                var self = this;
                var type = event.type;
                Slider[type](event);
            },
            run: function () {

                var self = this;

                this.setPositions(0);

                this.container.parent().css({'width': self.container.width() * self.container.length});

                if (this.support.touch) {
                    $(this.baseElement).on('touchstart touchmove touchend touchcancel', self.proxyListener);
                }


                this.updateInterval = setInterval(function () {
                    Slider.setPositions(Slider.getSlide($(Slider.container).eq(Slider.currentSlide)).next().index, true, -1)
                          .changeCurrent(1);
                }, 3000);

                /*$(this.slidesContainer).on('click', function (event) {
                    console.log('click', event)
                });*/

                return this;
            }
        }
    }();

    Slider.run();
});