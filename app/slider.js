
$(document).ready(function () {
    var Slider = function () {
        var sliderElement = $('[data-presentation-slider]');
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
            updateTimeout: undefined,
            container: container,

            support: (function () {
                return {
                    touch: window.ontouchstart !== undefined || (window.DocumentTouch && document instanceof DocumentTouch)
                }
            })(),

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

                        return next;
                    },
                    prev: function (css) {
                        var prev = $(currentSlide).prev().length == 0 ? $(self.container).last() : $(currentSlide).prev();

                        if(css !== undefined)
                            $(prev).css(css);

                        return prev;
                    }
                }
            },
            sliderTransition: 'transform 0.2s ease-in-out',
            toggleTransition: function (transition, element) {
                var self = this;
                if(transition) {
                    $(element || this.container).css({'transition': self.sliderTransition});
                } else {
                    $(element || this.container).css({'transition': 'none'});
                }
            },
            translate: function (target, deltaX, transition) {
                var self = this;

                this.toggleTransition(transition);

                $(target).css({'transform': 'translate(' + deltaX + 'px, 0)'});

                this.getSlide(target).next({'transform': 'translate('+(self.container.width() + deltaX)+'px, 0)'});
                this.getSlide(target).prev({'transform': 'translate('+(-1*self.container.width() + deltaX)+'px, 0)'});
            },
            touchstart : function (event) {
                console.log('touchstart');
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
                    this.translate(event.target, deltaX);
                }
            },
            touchend : function (event) {
                console.log('touchend');
                var isShortDuration = Number(Date.now() - touch.start.time) < 250,
                    slideWidth      = Slider.container.width(),
                    isNextCard      = (isShortDuration && Math.abs(touch.delta.x) > 20) || Math.abs(touch.delta.x) > slideWidth / 2,
                    direction       = touch.delta.x < 0 ? -1 : 1,
                    directionName   = (direction < 0) ? 'next' : 'prev';

                if(!isNextCard) {
                    console.log('translate to 0');
                    Slider.translate(event.target, 0, true);
                } else {
                    Slider.setPositions(Slider.getSlide(event.target)[directionName]().index(), true);
                }

            },
            setPositions: function (setIndex, transition) {
                setIndex = setIndex || 0;

                var self = this, contWidth = self.container.width();

                $.each(this.container, function (index, slide) {

                    var prev = ((index + 1) > self.container.length - 1) ? 0 : index + 1;
                    var next = ((index - 1) < 0) ? self.container.length - 1 : index - 1;

                    self.toggleTransition(transition);

                    if (setIndex == index) {
                        $(slide).css({'transform': 'translate(0,0)'});
                        //self.toggleTransition(transition, slide);
                    } else if(setIndex == next) {
                        $(slide).css({'transform': 'translate('+contWidth+'px,0)'});
                        //self.toggleTransition(transition, slide);
                    } else if(setIndex == prev) {
                        $(slide).css({'transform': 'translate('+(-1*contWidth)+'px,0)'});
                        //self.toggleTransition(transition, slide);
                    } else {
                        $(slide).css({'transform': 'translate('+contWidth+'px,0)'});
                    }

                    $(slide).css({'left': (-1 * index * $(slide).width())+'px', 'width': self.container.width()+'px'});
                });
            },
            proxyListener: function (event) {
                var self = this;
                var type = event.type;
                Slider[type](event);
                //this[event.type](event);
            },
            run: function () {

                var self = this;

                this.setPositions(0);

                this.container.parent().css({'width': self.container.width() * self.container.length});

                if (this.support.touch) {
                    $(this.container).on('touchstart touchmove touchend touchcancel', self.proxyListener);
                } else {
                    $(this.container).on('mousedown mousemove mouseup mouseout', self.proxyListener);
                }

                var startIndex   = Slider.getSlide($(self.container).first()).next().index(),
                    slidesLength = $(self.container).length - 1;

                setInterval(function () {
                    Slider.setPositions(startIndex++, true);

                    if(startIndex > slidesLength) startIndex = 0;
                }, 5000);

                /*$(this.slidesContainer).on('click', function (event) {
                    console.log('click', event)
                });*/

                return this;
            }
        }
    }();

    Slider.run();
});